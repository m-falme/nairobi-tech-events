import type { Prisma } from "@prisma/client";
import { z } from "zod";

export const PAGE_SIZE = 20;
export const EVENT_TYPES = [
  "hackathon",
  "meetup",
  "workshop",
  "conference",
  "other",
] as const;
export const FORMATS = ["online", "in-person"] as const;

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00+03:00`)));

export const RANGE_PRESETS = ["today", "week", "month"] as const;

const schema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  type: z.array(z.enum(EVENT_TYPES)).optional().catch(undefined),
  format: z.enum(FORMATS).optional().catch(undefined),
  range: z.enum(RANGE_PRESETS).optional().catch(undefined),
  from: dateString.optional().catch(undefined),
  to: dateString.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
});

export type EventFilters = z.infer<typeof schema>;
export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Parse URL search params; invalid values are dropped rather than erroring. */
export function parseFilters(params: RawSearchParams): EventFilters {
  const flat: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === "type") {
      const list = (Array.isArray(v) ? v : v ? [v] : [])
        .flatMap((x) => x.split(","))
        .filter((x): x is (typeof EVENT_TYPES)[number] =>
          (EVENT_TYPES as readonly string[]).includes(x),
        );
      flat.type = list.length ? [...new Set(list)] : undefined;
      continue;
    }
    const value = Array.isArray(v) ? v[0] : v;
    flat[k] = value === "" ? undefined : value;
  }
  const parsed = schema.parse(flat);
  if (parsed.q === "") parsed.q = undefined;
  return parsed;
}

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Start of a calendar day in Nairobi (UTC+3, no DST). */
export function nairobiDayStart(date: string): Date {
  return new Date(`${date}T00:00:00+03:00`);
}

/** Date range [start, end) in EAT: preset and custom from/to intersect. */
export function dateRange(
  f: EventFilters,
  now: Date,
): { start?: Date; end?: Date } {
  const eat = new Date(now.getTime() + EAT_OFFSET_MS);
  const y = eat.getUTCFullYear();
  const m = eat.getUTCMonth();
  const d = eat.getUTCDate();
  const day = (yy: number, mm: number, dd: number) =>
    new Date(Date.UTC(yy, mm, dd) - EAT_OFFSET_MS);
  let start: Date | undefined;
  let end: Date | undefined;
  if (f.range === "today") {
    start = day(y, m, d);
    end = day(y, m, d + 1);
  } else if (f.range === "week") {
    const sinceMonday = (eat.getUTCDay() + 6) % 7;
    start = day(y, m, d - sinceMonday);
    end = day(y, m, d - sinceMonday + 7);
  } else if (f.range === "month") {
    start = day(y, m, 1);
    end = day(y, m + 1, 1);
  }
  if (f.from) {
    const s = nairobiDayStart(f.from);
    if (!start || s > start) start = s;
  }
  if (f.to) {
    const e = nairobiDayStart(f.to);
    e.setUTCDate(e.getUTCDate() + 1);
    if (!end || e < end) end = e;
  }
  return { start, end };
}

/** Escape LIKE wildcards so user search text matches literally. */
export function escapeLike(q: string): string {
  return q.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Clamp a requested page into 1..totalPages(count). */
export function clampPage(page: number, count: number): number {
  return Math.min(Math.max(1, page), totalPages(count));
}

export function buildWhere(
  f: EventFilters,
  now: Date = new Date(),
): Prisma.EventWhereInput {
  const and: Prisma.EventWhereInput[] = [
    // Not yet ended: end >= now, or start >= now when there is no end.
    {
      OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }],
    },
  ];
  const { start, end } = dateRange(f, now);
  // An event is in the range if it overlaps it.
  if (end) and.push({ startsAt: { lt: end } });
  if (start) {
    and.push({
      OR: [
        { endsAt: { gte: start } },
        { endsAt: null, startsAt: { gte: start } },
      ],
    });
  }
  if (f.q) {
    const q = escapeLike(f.q);
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { venue: { contains: q, mode: "insensitive" } },
        { organiser: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  const where: Prisma.EventWhereInput = { status: "approved", AND: and };
  if (f.type?.length) where.type = { in: f.type };
  if (f.format) where.isOnline = f.format === "online";
  return where;
}

/** Build a query string for links, keeping current filters. */
export function toQueryString(
  f: EventFilters,
  overrides: Partial<EventFilters> = {},
): string {
  const merged = { ...f, ...overrides };
  const sp = new URLSearchParams();
  if (merged.q) sp.set("q", merged.q);
  for (const t of merged.type ?? []) sp.append("type", t);
  for (const key of ["format", "range", "from", "to"] as const) {
    const v = merged[key];
    if (v) sp.set(key, v);
  }
  if (merged.page && merged.page > 1) sp.set("page", String(merged.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function totalPages(count: number): number {
  return Math.max(1, Math.ceil(count / PAGE_SIZE));
}

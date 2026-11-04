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

const schema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  type: z.enum(EVENT_TYPES).optional().catch(undefined),
  format: z.enum(FORMATS).optional().catch(undefined),
  from: dateString.optional().catch(undefined),
  to: dateString.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
});

export type EventFilters = z.infer<typeof schema>;
export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Parse URL search params; invalid values are dropped rather than erroring. */
export function parseFilters(params: RawSearchParams): EventFilters {
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(params)) {
    const value = Array.isArray(v) ? v[0] : v;
    flat[k] = value === "" ? undefined : value;
  }
  const parsed = schema.parse(flat);
  if (parsed.q === "") parsed.q = undefined;
  return parsed;
}

/** Start of a calendar day in Nairobi (UTC+3, no DST). */
export function nairobiDayStart(date: string): Date {
  return new Date(`${date}T00:00:00+03:00`);
}

export function buildWhere(
  f: EventFilters,
  now: Date = new Date(),
): Prisma.EventWhereInput {
  const fromDate = f.from ? nairobiDayStart(f.from) : undefined;
  const lower = fromDate && fromDate > now ? fromDate : now;
  const startsAt: Prisma.DateTimeFilter = { gte: lower };
  if (f.to) {
    const end = nairobiDayStart(f.to);
    end.setUTCDate(end.getUTCDate() + 1);
    startsAt.lt = end;
  }
  const where: Prisma.EventWhereInput = { status: "approved", startsAt };
  if (f.type) where.type = f.type;
  if (f.format) where.isOnline = f.format === "online";
  if (f.q) {
    where.OR = [
      { title: { contains: f.q, mode: "insensitive" } },
      { description: { contains: f.q, mode: "insensitive" } },
      { venue: { contains: f.q, mode: "insensitive" } },
      { organiser: { contains: f.q, mode: "insensitive" } },
    ];
  }
  return where;
}

/** Build a query string for links, keeping current filters. */
export function toQueryString(
  f: EventFilters,
  overrides: Partial<EventFilters> = {},
): string {
  const merged = { ...f, ...overrides };
  const sp = new URLSearchParams();
  for (const key of ["q", "type", "format", "from", "to"] as const) {
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

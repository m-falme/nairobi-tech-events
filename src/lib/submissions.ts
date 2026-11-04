import { createHash } from "node:crypto";
import { z } from "zod";
import { EVENT_TYPES } from "./filters";
import { HONEYPOT_FIELD, type SubmitState } from "./submission-form";
import { eatDateTime, formToObject, httpUrl, optionalText } from "./review";

export { HONEYPOT_FIELD, type SubmitState };
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 60 * 60 * 1000;

export const submissionSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    startsAt: eatDateTime,
    endsAt: z
      .union([z.literal(""), eatDateTime])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    url: httpUrl,
    type: z.enum(EVENT_TYPES, { message: "Choose a type" }),
    venue: optionalText(200),
    description: z
      .string()
      .trim()
      .max(5000)
      .optional()
      .transform((s) => s ?? ""),
  })
  .refine((v) => !v.endsAt || v.endsAt >= v.startsAt, {
    message: "End must be on or after the start",
    path: ["endsAt"],
  });

/** First hop of x-forwarded-for, then x-real-ip, else "unknown". */
export function clientIp(headers: {
  get(name: string): string | null;
}): string {
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff) return xff;
  const real = headers.get("x-real-ip")?.trim();
  return real || "unknown";
}

/** Salted SHA-256 of the IP, so raw addresses are never stored. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export type SubmissionDb = {
  submissionAttempt: {
    count(args: {
      where: { ipHash: string; createdAt: { gte: Date } };
    }): Promise<number>;
    create(args: {
      data: { ipHash: string; createdAt: Date };
    }): Promise<unknown>;
    deleteMany(args: { where: { createdAt: { lt: Date } } }): Promise<unknown>;
  };
  event: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
};

/** DB-backed sliding window: allow RATE_LIMIT attempts per RATE_WINDOW_MS. */
export async function checkRateLimit(
  db: SubmissionDb,
  ipHash: string,
  now: Date,
): Promise<boolean> {
  const since = new Date(now.getTime() - RATE_WINDOW_MS);
  await db.submissionAttempt.deleteMany({
    where: { createdAt: { lt: since } },
  });
  const used = await db.submissionAttempt.count({
    where: { ipHash, createdAt: { gte: since } },
  });
  if (used >= RATE_LIMIT) return false;
  await db.submissionAttempt.create({ data: { ipHash, createdAt: now } });
  return true;
}

export type SubmitDeps = { db: SubmissionDb; ipHash: string; now: Date };

export async function submitCore(
  deps: SubmitDeps,
  fd: FormData,
): Promise<SubmitState> {
  const raw = formToObject(fd);
  // Honeypot filled: look successful, save nothing.
  if (raw[HONEYPOT_FIELD]?.trim()) return { status: "pending-review" };
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    const { [HONEYPOT_FIELD]: _hp, ...values } = raw;
    void _hp;
    return {
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values,
    };
  }
  if (!(await checkRateLimit(deps.db, deps.ipHash, deps.now)))
    return { status: "rate-limited" };
  await deps.db.event.create({
    data: {
      ...parsed.data,
      isOnline: false,
      status: "pending",
      sourceId: null,
    },
  });
  return { status: "pending-review" };
}

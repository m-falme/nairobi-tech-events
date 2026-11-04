import { z } from "zod";
import { EVENT_TYPES } from "./filters";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(200)),
  password: z
    .string()
    .min(1, "Password is required")
    .max(200, "Password is too long"),
});

export const idSchema = z.object({ id: z.uuid() });

export const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((u) => {
    try {
      return /^https?:$/.test(new URL(u).protocol);
    } catch {
      return false;
    }
  }, "Must be a valid http(s) URL");

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s === "" ? null : s))
    .nullable()
    .optional();

/** datetime-local value interpreted as Nairobi time (EAT, UTC+3). */
export const eatDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Use YYYY-MM-DDTHH:MM")
  .transform((s) => new Date(`${s}:00+03:00`))
  .refine((d) => !Number.isNaN(d.getTime()), "Invalid date");

/** Checkbox value: "on" when ticked, absent/"" otherwise. */
export const checkbox = z
  .union([z.literal("on"), z.literal("")])
  .optional()
  .transform((v) => v === "on");

export const editSchema = z
  .object({
    id: z.uuid(),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or fewer"),
    description: z.string().trim().max(10000).default(""),
    startsAt: eatDateTime,
    endsAt: z
      .union([z.literal(""), eatDateTime])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    venue: optionalText(200),
    organiser: optionalText(200),
    isOnline: checkbox,
    type: z.enum(EVENT_TYPES),
    url: httpUrl,
  })
  .refine((v) => !v.endsAt || v.endsAt >= v.startsAt, {
    message: "End must be after start",
    path: ["endsAt"],
  });

export type EditInput = z.infer<typeof editSchema>;

export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries())
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}

/** Format a Date as a datetime-local value in EAT. */
export function toEatInput(d: Date): string {
  return new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 16);
}

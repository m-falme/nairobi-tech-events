import { normaliseUrl } from "./duplicates";
import { z } from "zod";
import { assertAdmin, type MaybeSession } from "./authz";
import { editSchema, formToObject, idSchema } from "./review";

/** Minimal DB surface used by review actions, so they can be unit tested. */
export type ReviewDb = {
  event: {
    updateMany(args: {
      where: { id: string; status: "pending" };
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
  };
};

export type ReviewDeps = {
  getSession: () => Promise<MaybeSession | undefined>;
  db: ReviewDb;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
  errors?: Record<string, string[]>;
};

const NOT_PENDING = "This event is no longer pending (already reviewed?).";

/** Approve or reject a pending event. Throws UnauthorizedError if not admin. */
export async function setStatusCore(
  deps: ReviewDeps,
  fd: FormData,
  status: "approved" | "rejected",
): Promise<ActionResult> {
  assertAdmin(await deps.getSession());
  const parsed = idSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "Invalid event id." };
  const { count } = await deps.db.event.updateMany({
    where: { id: parsed.data.id, status: "pending" },
    data: { status },
  });
  return count === 0 ? { ok: false, error: NOT_PENDING } : { ok: true };
}

/** Validate edits and approve, only if the event is still pending. */
export async function editAndApproveCore(
  deps: ReviewDeps,
  fd: FormData,
): Promise<ActionResult> {
  assertAdmin(await deps.getSession());
  const parsed = editSchema.safeParse(formToObject(fd));
  if (!parsed.success)
    return {
      ok: false,
      errors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  const { id, ...data } = parsed.data;
  const { count } = await deps.db.event.updateMany({
    where: { id, status: "pending" },
    data: {
      ...data,
      normalizedUrl: normaliseUrl(data.url),
      status: "approved",
      adminEditedAt: new Date(),
    },
  });
  return count === 0 ? { ok: false, error: NOT_PENDING } : { ok: true };
}

export type MaybeSession = {
  user?: { email?: string | null; role?: string } | null;
} | null;

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export function isAdmin(session: MaybeSession | undefined): boolean {
  return Boolean(session?.user?.email && session.user.role === "admin");
}

/** Throw unless the session belongs to the admin. Used by every mutation. */
export function assertAdmin(session: MaybeSession | undefined): void {
  if (!isAdmin(session)) throw new UnauthorizedError();
}

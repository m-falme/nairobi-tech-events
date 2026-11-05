export const LOGIN_FAILURE_LIMIT = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

type LoginAttemptTable = {
  count(args: {
    where: { ipHash: string; createdAt: { gte: Date } };
  }): Promise<number>;
  create(args: {
    data: { ipHash: string; createdAt: Date };
  }): Promise<{ id: string }>;
  deleteMany(args: {
    where: { id: string } | { ipHash: string } | { createdAt: { lt: Date } };
  }): Promise<unknown>;
};

export type LoginLimitTx = {
  $executeRaw(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<number>;
  loginAttempt: LoginAttemptTable;
};

export type LoginLimitDb = LoginLimitTx & {
  $transaction<R>(fn: (tx: LoginLimitTx) => Promise<R>): Promise<R>;
};

/**
 * Reserve a login attempt for this IP hash. Under a per-IP advisory lock it
 * counts failures in the window and, if under the limit, records this attempt
 * as a failure up front (returning its id). Returns null when blocked.
 * Recording before the password check means concurrent guesses can't slip
 * past the limit; a successful login clears every attempt for that IP.
 */
export async function reserveLoginAttempt(
  db: LoginLimitDb,
  ipHash: string,
  now: Date,
): Promise<string | null> {
  const since = new Date(now.getTime() - LOGIN_WINDOW_MS);
  return db.$transaction(async (tx) => {
    // Key 1 keeps this lock separate from the submission limiter (key 0).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ipHash}, 1))`;
    await tx.loginAttempt.deleteMany({ where: { createdAt: { lt: since } } });
    const failures = await tx.loginAttempt.count({
      where: { ipHash, createdAt: { gte: since } },
    });
    if (failures >= LOGIN_FAILURE_LIMIT) return null;
    const row = await tx.loginAttempt.create({
      data: { ipHash, createdAt: now },
    });
    return row.id;
  });
}

/**
 * Successful login: wipe every recent failure for this IP hash so the user
 * starts fresh (4 fails → success → 1 fail must still leave 4 slots).
 */
export async function clearLoginAttempts(db: LoginLimitDb, ipHash: string) {
  await db.loginAttempt.deleteMany({ where: { ipHash } });
}

export type LoginCheck = {
  db: LoginLimitDb;
  ipHash: string;
  now: Date;
  verify: () => Promise<boolean>;
};

/** Rate-limited credential check: false for wrong creds AND when blocked. */
export async function limitedLogin({
  db,
  ipHash,
  now,
  verify,
}: LoginCheck): Promise<boolean> {
  const id = await reserveLoginAttempt(db, ipHash, now);
  if (!id) return false;
  const ok = await verify();
  if (ok) await clearLoginAttempts(db, ipHash);
  return ok;
}

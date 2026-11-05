import { describe, expect, it, vi } from "vitest";
import {
  limitedLogin,
  LOGIN_FAILURE_LIMIT,
  LOGIN_WINDOW_MS,
  reserveLoginAttempt,
  type LoginLimitDb,
} from "./login-rate-limit";

function fakeDb() {
  let rows: { id: string; ipHash: string; createdAt: Date }[] = [];
  let n = 0;
  const locks: string[] = [];
  const db = {
    $executeRaw: vi.fn(async (q: TemplateStringsArray, ...v: unknown[]) => {
      locks.push(q.join("?") + "|" + String(v[0]));
      return 1;
    }),
    loginAttempt: {
      count: async ({
        where,
      }: {
        where: { ipHash: string; createdAt: { gte: Date } };
      }) =>
        rows.filter(
          (r) =>
            r.ipHash === where.ipHash && r.createdAt >= where.createdAt.gte,
        ).length,
      create: async ({
        data,
      }: {
        data: { ipHash: string; createdAt: Date };
      }) => {
        const row = { id: `id${n++}`, ...data };
        rows.push(row);
        return { id: row.id };
      },
      deleteMany: async ({
        where,
      }: {
        where: { id: string } | { createdAt: { lt: Date } };
      }) => {
        rows =
          "id" in where
            ? rows.filter((r) => r.id !== where.id)
            : rows.filter((r) => r.createdAt >= where.createdAt.lt);
      },
    },
  } as unknown as LoginLimitDb;
  (db as unknown as { $transaction: unknown }).$transaction = (
    fn: (tx: LoginLimitDb) => unknown,
  ) => fn(db);
  return { db, rows: () => rows, locks };
}

const t0 = new Date("2026-11-05T00:00:00Z");
const bad = () => Promise.resolve(false);
const good = () => Promise.resolve(true);

describe("login rate limit", () => {
  it("blocks after 5 failures in 15 minutes, even with the right password", async () => {
    const { db } = fakeDb();
    for (let i = 0; i < LOGIN_FAILURE_LIMIT; i++)
      expect(
        await limitedLogin({ db, ipHash: "a", now: t0, verify: bad }),
      ).toBe(false);
    const verify = vi.fn(good);
    expect(await limitedLogin({ db, ipHash: "a", now: t0, verify })).toBe(
      false,
    );
    expect(verify).not.toHaveBeenCalled();
  });

  it("allows again once the window passes", async () => {
    const { db } = fakeDb();
    for (let i = 0; i < LOGIN_FAILURE_LIMIT; i++)
      await limitedLogin({ db, ipHash: "a", now: t0, verify: bad });
    const later = new Date(t0.getTime() + LOGIN_WINDOW_MS + 1);
    expect(
      await limitedLogin({ db, ipHash: "a", now: later, verify: good }),
    ).toBe(true);
  });

  it("is per IP hash", async () => {
    const { db } = fakeDb();
    for (let i = 0; i < LOGIN_FAILURE_LIMIT; i++)
      await limitedLogin({ db, ipHash: "a", now: t0, verify: bad });
    expect(await limitedLogin({ db, ipHash: "b", now: t0, verify: good })).toBe(
      true,
    );
  });

  it("successful logins don't count as failures", async () => {
    const { db, rows } = fakeDb();
    for (let i = 0; i < 10; i++)
      expect(
        await limitedLogin({ db, ipHash: "a", now: t0, verify: good }),
      ).toBe(true);
    expect(rows()).toHaveLength(0);
  });

  it("takes a per-IP advisory lock separate from the submission lock", async () => {
    const { db, locks } = fakeDb();
    expect(await reserveLoginAttempt(db, "hash1", t0)).toBeTruthy();
    expect(locks[0]).toContain("pg_advisory_xact_lock(hashtextextended(?, 1))");
    expect(locks[0]).toContain("|hash1");
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  clientIp,
  hashIp,
  ipSalt,
  RATE_WINDOW_MS,
  submissionSchema,
  submitCore,
  type RateLimitTx,
  type SubmissionDb,
} from "./submissions";

/** In-memory fake of the Prisma calls used by submissions. */
function fakeDb() {
  const attempts: { ipHash: string; createdAt: Date }[] = [];
  const events: Record<string, unknown>[] = [];
  const locks: string[] = [];
  const tx: RateLimitTx = {
    $executeRaw: async (_q, ...v) => {
      locks.push(String(v[0]));
      return 1;
    },
    submissionAttempt: {
      count: async ({ where }) =>
        attempts.filter(
          (a) =>
            a.ipHash === where.ipHash && a.createdAt >= where.createdAt.gte,
        ).length,
      create: async ({ data }) => attempts.push(data),
      deleteMany: async ({ where }) => {
        for (let i = attempts.length - 1; i >= 0; i--)
          if (attempts[i].createdAt < where.createdAt.lt) attempts.splice(i, 1);
      },
    },
  };
  const db: SubmissionDb = {
    $transaction: async (fn) => fn(tx),
    event: { create: vi.fn(async ({ data }) => events.push(data)) },
  };
  return { db, attempts, events, locks };
}

const valid = {
  title: "Nairobi JS",
  startsAt: "2026-11-10T18:00",
  endsAt: "",
  url: "https://lu.ma/x",
  type: "meetup",
  venue: "",
  description: "",
};
const form = (v: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, x] of Object.entries(v)) fd.set(k, x);
  return fd;
};
const now = new Date("2026-11-05T10:00:00Z");

describe("submissionSchema", () => {
  it("accepts required fields only and reads EAT", () => {
    const r = submissionSchema.parse({
      title: "T",
      startsAt: "2026-11-10T18:00",
      url: "https://x.org",
      type: "workshop",
    });
    expect(r.startsAt).toEqual(new Date("2026-11-10T15:00:00Z"));
    expect(r.endsAt).toBeNull();
    expect(r.venue).toBeUndefined();
    expect(r.description).toBe("");
  });
  it.each([
    ["missing title", { title: "" }],
    ["missing start", { startsAt: "" }],
    ["missing url", { url: "" }],
    ["notaurl (no throw)", { url: "notaurl" }],
    ["javascript url", { url: "javascript:alert(1)" }],
    ["ftp url", { url: "ftp://x.org" }],
    ["missing type", { type: "" }],
    ["end before start", { endsAt: "2026-11-10T17:59" }],
  ])("rejects %s", (_n, patch) => {
    expect(submissionSchema.safeParse({ ...valid, ...patch }).success).toBe(
      false,
    );
  });
  it("allows end equal to start", () => {
    expect(
      submissionSchema.safeParse({ ...valid, endsAt: valid.startsAt }).success,
    ).toBe(true);
  });
});

describe("clientIp / hashIp", () => {
  const h = (o: Record<string, string>) => ({
    get: (k: string) => o[k] ?? null,
  });
  it("uses the first x-forwarded-for hop", () => {
    expect(clientIp(h({ "x-forwarded-for": " 41.90.1.2 , 10.0.0.1" }))).toBe(
      "41.90.1.2",
    );
  });
  it("falls back to x-real-ip, then unknown", () => {
    expect(clientIp(h({ "x-real-ip": "41.90.1.3" }))).toBe("41.90.1.3");
    expect(clientIp(h({ "x-forwarded-for": "" }))).toBe("unknown");
  });
  it("hashes with a salt and never returns the raw IP", () => {
    const a = hashIp("41.90.1.2", "s1");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("41.90");
    expect(hashIp("41.90.1.2", "s2")).not.toBe(a);
  });
});

describe("ipSalt", () => {
  it("fails fast without AUTH_SECRET", () => {
    expect(() => ipSalt({})).toThrow(/AUTH_SECRET/);
    expect(() => ipSalt({ AUTH_SECRET: "  " })).toThrow(/AUTH_SECRET/);
    expect(ipSalt({ AUTH_SECRET: "s" })).toBe("s");
  });
});

describe("checkRateLimit", () => {
  it("takes a per-IP advisory lock inside the transaction", async () => {
    const { db, locks } = fakeDb();
    await checkRateLimit(db, "iphash", now);
    expect(locks).toEqual(["iphash"]);
  });

  it("allows 5, blocks the 6th, and resets after the window", async () => {
    const { db } = fakeDb();
    for (let i = 0; i < 5; i++)
      expect(await checkRateLimit(db, "ip", new Date(now.getTime() + i))).toBe(
        true,
      );
    expect(await checkRateLimit(db, "ip", new Date(now.getTime() + 10))).toBe(
      false,
    );
    expect(await checkRateLimit(db, "other", now)).toBe(true);
    const later = new Date(now.getTime() + RATE_WINDOW_MS + 1000);
    expect(await checkRateLimit(db, "ip", later)).toBe(true);
  });
});

describe("submitCore", () => {
  it("saves a pending event with no source and reports pending review", async () => {
    const { db, events } = fakeDb();
    const r = await submitCore({ db, ipHash: "h", now }, form(valid));
    expect(r).toEqual({ status: "pending-review" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      title: "Nairobi JS",
      status: "pending",
      sourceId: null,
      url: "https://lu.ma/x",
    });
  });
  it("defaults to in person when the Online box is unticked", async () => {
    const { db, events } = fakeDb();
    await submitCore({ db, ipHash: "h", now }, form(valid));
    expect(events[0]).toMatchObject({ isOnline: false, venue: null });
  });
  it("saves isOnline when the Online event box is ticked, venue optional", async () => {
    const { db, events } = fakeDb();
    const r = await submitCore(
      { db, ipHash: "h", now },
      form({ ...valid, isOnline: "on" }),
    );
    expect(r).toEqual({ status: "pending-review" });
    expect(events[0]).toMatchObject({ isOnline: true, venue: null });
  });
  it("keeps a venue for online events when given", () => {
    const r = submissionSchema.safeParse({
      ...valid,
      isOnline: "on",
      venue: "Zoom",
    });
    expect(r.success && r.data).toMatchObject({
      isOnline: true,
      venue: "Zoom",
    });
  });
  it("rejects unexpected isOnline values", () => {
    expect(
      submissionSchema.safeParse({ ...valid, isOnline: "yes" }).success,
    ).toBe(false);
  });
  it("honeypot: looks successful but saves nothing and uses no quota", async () => {
    const { db, events, attempts } = fakeDb();
    const r = await submitCore(
      { db, ipHash: "h", now },
      form({ ...valid, website: "http://spam" }),
    );
    expect(r).toEqual({ status: "pending-review" });
    expect(events).toHaveLength(0);
    expect(attempts).toHaveLength(0);
  });
  it("returns field errors and values (without honeypot) for invalid input", async () => {
    const { db, events } = fakeDb();
    const r = await submitCore(
      { db, ipHash: "h", now },
      form({ ...valid, url: "notaurl", website: "" }),
    );
    expect(r.errors?.url).toBeDefined();
    expect(r.values?.title).toBe("Nairobi JS");
    expect(r.values).not.toHaveProperty("website");
    expect(events).toHaveLength(0);
  });
  it("blocks the 6th submission in an hour", async () => {
    const { db, events } = fakeDb();
    for (let i = 0; i < 5; i++)
      await submitCore({ db, ipHash: "h", now }, form(valid));
    const r = await submitCore({ db, ipHash: "h", now }, form(valid));
    expect(r).toEqual({ status: "rate-limited" });
    expect(events).toHaveLength(5);
  });
});

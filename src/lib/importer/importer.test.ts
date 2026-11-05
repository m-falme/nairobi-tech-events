import { normaliseUrl } from "../duplicates";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { rssAdapter } from "./adapters";
import { approvedLumaCalendar, isImportAllowed, lumaIcsUrl } from "./allowlist";
import {
  DEFAULT_USER_AGENT,
  fetchText,
  MAX_BYTES,
  parseRetryAfter,
} from "./fetch";
import { eventPageUrl, inferType, parseIcs } from "./ical";
import { MIN_INTERVAL_MS, runImport, type ImportDb } from "./run";
import { toPlainText } from "./text";
import type { ImportSource } from "./types";

const fixture = (n: string) =>
  readFileSync(join(__dirname, "fixtures", n), "utf8");

const TK = "cal-tNFqmDwu6YpmOOJ";
const QK = "cal-Cpt1V9LBIY4ETmr";

describe("allowlist", () => {
  it("accepts only the two approved Luma calendar feeds", () => {
    expect(approvedLumaCalendar(lumaIcsUrl(TK))).toBe(TK);
    expect(approvedLumaCalendar(lumaIcsUrl(QK))).toBe(QK);
    expect(approvedLumaCalendar(lumaIcsUrl("cal-other"))).toBeNull();
    expect(
      approvedLumaCalendar(`http://api.lu.ma/ics/get?entity=calendar&id=${TK}`),
    ).toBeNull();
    expect(
      approvedLumaCalendar(
        `https://evil.example/ics/get?entity=calendar&id=${TK}`,
      ),
    ).toBeNull();
    expect(approvedLumaCalendar("not a url")).toBeNull();
    expect(approvedLumaCalendar(null)).toBeNull();
  });
  it("requires active ical sources", () => {
    const s = { kind: "ical", url: lumaIcsUrl(TK), active: true };
    expect(isImportAllowed(s)).toBe(true);
    expect(isImportAllowed({ ...s, active: false })).toBe(false);
    expect(isImportAllowed({ ...s, kind: "rss" })).toBe(false);
  });
});

describe("toPlainText", () => {
  it("strips HTML, images and entities", () => {
    const out = toPlainText(
      'Hi <b>there</b> &amp; welcome<img src="https://x.org/a.png"> ![i](https://x.org/b.jpg) https://cdn.x/c.webp?w=1 data:image/png;base64,AAAA &#39;ok&#39;',
    );
    expect(out).toBe("Hi there & welcome 'ok'");
    expect(out).not.toMatch(/png|jpg|webp|<|data:/);
  });
  it("caps length", () => {
    expect(toPlainText("a".repeat(50), 10)).toHaveLength(10);
  });
});

describe("parseIcs (recorded fixtures)", () => {
  const events = parseIcs(fixture("techkenya.ics"));
  it("keeps events with a link back and skips cancelled/unlinked ones", () => {
    expect(events.map((e) => e.externalId)).toEqual([
      "evt-AbC123@events.lu.ma",
      "evt-DeF456@events.lu.ma",
    ]);
  });
  it("maps text fields only, with the official page URL", () => {
    const [a, b] = events;
    expect(a).toMatchObject({
      title: "Nairobi AI Builders Meetup",
      url: "https://luma.com/ai-builders-nbo",
      venue: "iHub, Senteu Plaza, Nairobi",
      isOnline: false,
      type: "meetup",
      organiser: "Tech Kenya",
    });
    expect(a.startsAt.toISOString()).toBe("2026-11-20T15:00:00.000Z");
    expect(a.description).toContain("Talks on LLM agents & demos.");
    expect(JSON.stringify(events)).not.toMatch(/lumacdn|\.png|\.jpg|<img/);
    // TZID=Africa/Nairobi 09:00 -> 06:00Z; LOCATION URL -> online, no venue
    expect(b.startsAt.toISOString()).toBe("2026-12-05T06:00:00.000Z");
    expect(b).toMatchObject({
      isOnline: true,
      venue: null,
      type: "hackathon",
      url: "https://lu.ma/kfh2026",
    });
  });
  it("parses the QuantumKE fixture", () => {
    const [q] = parseIcs(fixture("quantumke.ics"));
    expect(q).toMatchObject({
      type: "workshop",
      url: "https://luma.com/qk-intro",
    });
  });
  it("tolerates malformed events and rejects non-iCal bodies", () => {
    expect(parseIcs(fixture("malformed.ics"))).toEqual([]);
    expect(() => parseIcs("<html>blocked</html>")).toThrow(/not an iCal/);
  });
  it("helpers", () => {
    expect(
      eventPageUrl("javascript:alert(1)", "see https://lu.ma/x1 now"),
    ).toBe("https://lu.ma/x1");
    expect(eventPageUrl("", "nothing")).toBeNull();
    expect(inferType("DevFest Nairobi Summit")).toBe("conference");
    expect(inferType("Random talk")).toBe("other");
  });
});

describe("rss adapter", () => {
  it("is a stub for now", async () => {
    await expect(
      rssAdapter.load({} as ImportSource, async () => ""),
    ).rejects.toThrow(/not enabled/);
  });
});

describe("fetchText", () => {
  const FEED = lumaIcsUrl(TK);
  const res = (
    status: number,
    body: BodyInit | null = "",
    headers: Record<string, string> = {},
  ) => new Response(body, { status, headers });
  const noSleep = vi.fn(async () => {});

  it("sends our User-Agent, manual redirects and a timeout", async () => {
    const f = vi.fn(async () => res(200, "BEGIN:VCALENDAR"));
    const body = await fetchText(FEED, {
      fetchImpl: f as unknown as typeof fetch,
    });
    expect(body).toBe("BEGIN:VCALENDAR");
    const init = (f.mock.calls[0] as unknown[])[1] as RequestInit;
    expect((init.headers as Record<string, string>)["User-Agent"]).toBe(
      DEFAULT_USER_AGENT,
    );
    expect(init.redirect).toBe("manual");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("refuses a non-allowlisted initial URL without fetching", async () => {
    const f = vi.fn();
    await expect(
      fetchText("https://example.com/x.ics", { fetchImpl: f }),
    ).rejects.toThrow(/not allowed/);
    expect(f).not.toHaveBeenCalled();
  });

  it("follows redirects that stay on the allowlist", async () => {
    const qk = lumaIcsUrl(QK);
    const f = vi
      .fn()
      .mockResolvedValueOnce(res(302, null, { location: qk }))
      .mockResolvedValueOnce(res(200, "BEGIN:VCALENDAR"));
    expect(await fetchText(FEED, { fetchImpl: f })).toBe("BEGIN:VCALENDAR");
    expect(f.mock.calls[1][0]).toBe(qk);
  });

  it.each([
    ["other host", "https://evil.example/ics/get?entity=calendar&id=" + TK],
    ["other calendar", "https://api.lu.ma/ics/get?entity=calendar&id=cal-x"],
    ["http downgrade", "http://api.lu.ma/ics/get?entity=calendar&id=" + TK],
    ["other path", "/ics/other?entity=calendar&id=" + TK],
  ])("fails when a redirect hop goes to %s", async (_n, loc) => {
    const f = vi.fn().mockResolvedValueOnce(res(301, null, { location: loc }));
    await expect(
      fetchText(FEED, { fetchImpl: f, sleep: noSleep }),
    ).rejects.toThrow(/not allowed/);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("fails after more than 3 redirects", async () => {
    const f = vi.fn(async () => res(302, null, { location: FEED }));
    await expect(
      fetchText(FEED, {
        fetchImpl: f as unknown as typeof fetch,
        sleep: noSleep,
      }),
    ).rejects.toThrow(/Too many redirects/);
    expect(f).toHaveBeenCalledTimes(4);
  });

  it("aborts a streamed body over the byte cap (bytes, not chars)", async () => {
    // Endless "éé" chunks: 2 chars but 4 bytes each; must stop at the cap.
    let cancelled = false;
    let pulls = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        pulls++;
        c.enqueue(new TextEncoder().encode("éé"));
      },
      cancel() {
        cancelled = true;
      },
    });
    // A Response-like object so we observe the underlying stream directly.
    const f = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      body: stream,
    }));
    await expect(
      fetchText(FEED, {
        fetchImpl: f as unknown as typeof fetch,
        maxBytes: 6,
      }),
    ).rejects.toThrow(/too large/);
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThan(5);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("accepts a body exactly at the cap and rejects a large Content-Length", async () => {
    const ok = vi.fn(async () => res(200, "éé"));
    expect(
      await fetchText(FEED, {
        fetchImpl: ok as unknown as typeof fetch,
        maxBytes: 4,
      }),
    ).toBe("éé");
    const big = vi.fn(async () =>
      res(200, "x", { "content-length": String(MAX_BYTES + 1) }),
    );
    await expect(
      fetchText(FEED, { fetchImpl: big as unknown as typeof fetch }),
    ).rejects.toThrow(/too large/);
  });

  it("retries network errors, 429 and 5xx with backoff and Retry-After", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(res(503))
      .mockResolvedValueOnce(res(429, "", { "retry-after": "30" }))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(res(200, "ok"));
    const sleep = vi.fn(async () => {});
    const body = await fetchText(FEED, {
      fetchImpl: f,
      sleep,
      baseDelayMs: 1000,
      userAgent: "Custom/1",
    });
    expect(body).toBe("ok");
    expect(sleep.mock.calls.map((c) => (c as unknown[])[0])).toEqual([
      1000, 30000, 4000,
    ]);
  });

  it.each([400, 403, 404, 410])("does not retry HTTP %i", async (status) => {
    const f = vi.fn(async () => res(status));
    const sleep = vi.fn(async () => {});
    await expect(
      fetchText(FEED, { fetchImpl: f as unknown as typeof fetch, sleep }),
    ).rejects.toThrow(`HTTP ${status}`);
    expect(f).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("gives up after the retry budget on 5xx", async () => {
    const f = vi.fn(async () => res(502));
    await expect(
      fetchText(FEED, {
        fetchImpl: f as unknown as typeof fetch,
        sleep: noSleep,
        retries: 2,
      }),
    ).rejects.toThrow("HTTP 502");
    expect(f).toHaveBeenCalledTimes(3);
  });
});

describe("parseRetryAfter", () => {
  const now = Date.parse("2026-11-05T00:00:00Z");
  it("parses seconds and HTTP-dates, capped at 60s", () => {
    expect(parseRetryAfter("5", now)).toBe(5000);
    expect(parseRetryAfter("3600", now)).toBe(60_000);
    expect(parseRetryAfter("Thu, 05 Nov 2026 00:00:20 GMT", now)).toBe(20_000);
    expect(parseRetryAfter("Thu, 05 Nov 2026 02:00:00 GMT", now)).toBe(60_000);
    expect(parseRetryAfter("Wed, 04 Nov 2026 00:00:00 GMT", now)).toBe(0);
    expect(parseRetryAfter("soon", now)).toBeUndefined();
    expect(parseRetryAfter(null, now)).toBeUndefined();
  });
});

/** In-memory fake of the Prisma calls the importer makes. */
function fakeDb(sources: ImportSource[]) {
  const events: Record<string, unknown>[] = [];
  const runs: Record<string, unknown>[] = [];
  const db: ImportDb = {
    source: {
      findMany: async () => sources,
      update: async ({ where, data }) =>
        Object.assign(
          sources.find((s) => s.id === where.id)!,
          data,
        ),
    },
    importRun: {
      create: async ({ data }) => {
        const r = { id: `run${runs.length}`, ...data };
        runs.push(r);
        return r;
      },
      update: async ({ where, data }) =>
        Object.assign(
          runs.find((r) => r.id === where.id)!,
          data,
        ),
    },
    event: {
      findUnique: async ({ where }) => {
        const k = where.sourceId_externalId;
        const e = events.find(
          (x) => x.sourceId === k.sourceId && x.externalId === k.externalId,
        );
        return e
          ? {
              id: e.id as string,
              adminEditedAt: (e.adminEditedAt as Date | undefined) ?? null,
            }
          : null;
      },
      create: async ({ data }) =>
        events.push({ id: `e${events.length}`, ...data }),
      update: async ({ where, data }) =>
        Object.assign(
          events.find((e) => e.id === where.id)!,
          data,
        ),
    },
  };
  return { db, events, runs };
}

const src = (o: Partial<ImportSource>): ImportSource => ({
  id: "s1",
  name: "Tech Kenya",
  kind: "ical",
  url: lumaIcsUrl(TK),
  trusted: false,
  active: true,
  lastFetchedAt: null,
  ...o,
});

const now = new Date("2026-11-05T12:00:00Z");
const feeds: Record<string, string> = {
  [lumaIcsUrl(TK)]: fixture("techkenya.ics"),
  [lumaIcsUrl(QK)]: fixture("quantumke.ics"),
};
const fakeFetch = vi.fn(async (url: string) => {
  if (url in feeds) return feeds[url];
  throw new Error("HTTP 500");
});

describe("runImport", () => {
  it("inserts pending for untrusted, approved for trusted, and records runs", async () => {
    const { db, events, runs } = fakeDb([
      src({}),
      src({ id: "s2", name: "QuantumKE", url: lumaIcsUrl(QK), trusted: true }),
    ]);
    const r = await runImport({ db, fetchText: fakeFetch, now: () => now });
    expect(r.map((x) => [x.status, x.added])).toEqual([
      ["success", 2],
      ["success", 1],
    ]);
    expect(
      events.filter((e) => e.sourceId === "s1").map((e) => e.status),
    ).toEqual(["pending", "pending"]);
    expect(events.find((e) => e.sourceId === "s2")?.status).toBe("approved");
    expect(runs).toHaveLength(2);
    for (const e of events)
      expect(e.normalizedUrl).toBe(normaliseUrl(e.url as string));
    expect(runs[0]).toMatchObject({ status: "success", added: 2, updated: 0 });
    expect(runs[0].finishedAt).toBeInstanceOf(Date);
  });

  it("upserts by (sourceId, externalId) without touching status", async () => {
    const s = src({});
    const { db, events } = fakeDb([s]);
    await runImport({ db, fetchText: fakeFetch, now: () => now });
    events[0].status = "rejected";
    events[0].title = "old";
    const later = new Date(now.getTime() + MIN_INTERVAL_MS);
    const r = await runImport({ db, fetchText: fakeFetch, now: () => later });
    expect(r[0]).toMatchObject({ added: 0, updated: 2 });
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      status: "rejected",
      title: "Nairobi AI Builders Meetup",
    });
    events[0].normalizedUrl = "stale";
    await runImport({
      db,
      fetchText: fakeFetch,
      now: () => new Date(later.getTime() + MIN_INTERVAL_MS),
    });
    expect(events[0].normalizedUrl).toBe(normaliseUrl(events[0].url as string));
  });

  it("does not overwrite events an admin has edited", async () => {
    const { db, events } = fakeDb([src({})]);
    await runImport({ db, fetchText: fakeFetch, now: () => now });
    Object.assign(events[0], {
      title: "Admin title",
      description: "Admin text",
      adminEditedAt: now,
      status: "approved",
    });
    const later = new Date(now.getTime() + MIN_INTERVAL_MS);
    const r = await runImport({ db, fetchText: fakeFetch, now: () => later });
    expect(r[0]).toMatchObject({ added: 0, updated: 1 });
    expect(events[0]).toMatchObject({
      title: "Admin title",
      description: "Admin text",
      status: "approved",
    });
    expect(events[1].title).toBe("Kenya Fintech Hackathon 2026");
  });

  it("skips sources fetched less than 6h ago", async () => {
    const recent = new Date(now.getTime() - MIN_INTERVAL_MS + 60_000);
    const { db, runs } = fakeDb([src({ lastFetchedAt: recent })]);
    fakeFetch.mockClear();
    const r = await runImport({ db, fetchText: fakeFetch, now: () => now });
    expect(r[0].status).toBe("skipped");
    expect(fakeFetch).not.toHaveBeenCalled();
    expect(runs[0]).toMatchObject({ status: "skipped" });
  });

  it("never fetches non-allowlisted sources", async () => {
    const { db, runs } = fakeDb([
      src({ id: "x", url: lumaIcsUrl("cal-notapproved") }),
      src({ id: "y", kind: "rss", url: "https://example.com/feed" }),
      src({ id: "z", url: "https://example.com/nairobi-tech.ics" }),
    ]);
    fakeFetch.mockClear();
    const r = await runImport({ db, fetchText: fakeFetch, now: () => now });
    expect(r.every((x) => x.status === "not-allowed")).toBe(true);
    expect(fakeFetch).not.toHaveBeenCalled();
    expect(runs).toHaveLength(0);
  });

  it("one failing source does not stop the run; error is logged on the source", async () => {
    const failing = src({ id: "s1" });
    const ok = src({ id: "s2", name: "QuantumKE", url: lumaIcsUrl(QK) });
    const { db, runs, events } = fakeDb([failing, ok]);
    const fetchFn = vi.fn(async (url: string) => {
      if (url === lumaIcsUrl(TK)) throw new Error("HTTP 503");
      return feeds[url];
    });
    const r = await runImport({ db, fetchText: fetchFn, now: () => now });
    expect(r.map((x) => x.status)).toEqual(["failed", "success"]);
    expect((failing as { lastError?: string }).lastError).toBe("HTTP 503");
    expect(failing.lastFetchedAt).toEqual(now);
    expect((ok as { lastError?: string | null }).lastError).toBeNull();
    expect(runs[0]).toMatchObject({ status: "failed", error: "HTTP 503" });
    expect(events).toHaveLength(1);
  });
});

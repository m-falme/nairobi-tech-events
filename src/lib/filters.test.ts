import { describe, expect, it } from "vitest";
import {
  buildWhere,
  clampPage,
  dateRange,
  escapeLike,
  parseFilters,
  toQueryString,
  totalPages,
} from "./filters";

// Thursday 5 Nov 2026, 12:00 EAT
const now = new Date("2026-11-05T09:00:00Z");
const notEnded = {
  OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }],
};

describe("parseFilters", () => {
  it("defaults to page 1 with no filters", () => {
    expect(parseFilters({})).toEqual({ page: 1 });
  });
  it("accepts valid values", () => {
    expect(
      parseFilters({
        q: " react ",
        type: "meetup",
        format: "online",
        from: "2026-11-10",
        to: "2026-11-20",
        page: "3",
      }),
    ).toEqual({
      q: "react",
      type: ["meetup"],
      format: "online",
      from: "2026-11-10",
      to: "2026-11-20",
      page: 3,
    });
  });
  it("supports multi-select type via repeated params, deduped", () => {
    expect(
      parseFilters({ type: ["workshop", "meetup", "bogus", "meetup"] }).type,
    ).toEqual(["workshop", "meetup"]);
  });
  it("drops invalid values", () => {
    expect(
      parseFilters({
        type: "party",
        format: "x",
        range: "year",
        page: "-2",
        q: "",
      }),
    ).toEqual({ page: 1 });
  });
  it("accepts a comma list of types and drops invalid ones", () => {
    expect(parseFilters({ type: "meetup,bogus,workshop" }).type).toEqual([
      "meetup",
      "workshop",
    ]);
  });
  it("accepts repeated type params", () => {
    expect(parseFilters({ type: ["hackathon", "meetup"] }).type).toEqual([
      "hackathon",
      "meetup",
    ]);
  });
  it("keeps range combined with custom from/to", () => {
    const f = parseFilters({ range: "month", from: "2026-11-10" });
    expect(f).toEqual({ page: 1, range: "month", from: "2026-11-10" });
  });
});

describe("dateRange (EAT)", () => {
  it("today", () => {
    expect(dateRange({ page: 1, range: "today" }, now)).toEqual({
      start: new Date("2026-11-04T21:00:00Z"),
      end: new Date("2026-11-05T21:00:00Z"),
    });
  });
  it("uses the EAT day near midnight UTC", () => {
    // 22:30 UTC on 4 Nov is 01:30 EAT on 5 Nov
    const r = dateRange(
      { page: 1, range: "today" },
      new Date("2026-11-04T22:30:00Z"),
    );
    expect(r.start).toEqual(new Date("2026-11-04T21:00:00Z"));
  });
  it("this week runs Monday to Sunday", () => {
    expect(dateRange({ page: 1, range: "week" }, now)).toEqual({
      start: new Date("2026-11-01T21:00:00Z"),
      end: new Date("2026-11-08T21:00:00Z"),
    });
  });
  it("intersects a preset with a custom range", () => {
    expect(
      dateRange({ page: 1, range: "month", from: "2026-11-10" }, now),
    ).toEqual({
      start: new Date("2026-11-09T21:00:00Z"),
      end: new Date("2026-11-30T21:00:00Z"),
    });
  });
  it("this month at a month boundary near EAT midnight", () => {
    // 21:30 UTC on 30 Nov is 00:30 EAT on 1 Dec
    expect(
      dateRange({ page: 1, range: "month" }, new Date("2026-11-30T21:30:00Z")),
    ).toEqual({
      start: new Date("2026-11-30T21:00:00Z"),
      end: new Date("2026-12-31T21:00:00Z"),
    });
  });
  it("this month", () => {
    expect(dateRange({ page: 1, range: "month" }, now)).toEqual({
      start: new Date("2026-10-31T21:00:00Z"),
      end: new Date("2026-11-30T21:00:00Z"),
    });
  });
  it("custom range is inclusive of the end day", () => {
    expect(
      dateRange({ page: 1, from: "2026-11-10", to: "2026-11-10" }, now),
    ).toEqual({
      start: new Date("2026-11-09T21:00:00Z"),
      end: new Date("2026-11-10T21:00:00Z"),
    });
  });
});

describe("buildWhere", () => {
  it("only shows approved, not-yet-ended events", () => {
    expect(buildWhere({ page: 1 }, now)).toEqual({
      status: "approved",
      AND: [notEnded],
    });
  });
  it("applies multi type, format and search", () => {
    const w = buildWhere(
      {
        page: 1,
        type: ["hackathon", "meetup"],
        format: "in-person",
        q: "ai",
      },
      now,
    );
    expect(w.type).toEqual({ in: ["hackathon", "meetup"] });
    expect(w.isOnline).toBe(false);
    expect(w.AND).toHaveLength(2);
  });
  it("adds overlap bounds for a date preset", () => {
    const w = buildWhere({ page: 1, range: "today" }, now);
    const start = new Date("2026-11-04T21:00:00Z");
    expect(w.AND).toEqual([
      notEnded,
      { startsAt: { lt: new Date("2026-11-05T21:00:00Z") } },
      {
        OR: [
          { endsAt: { gte: start } },
          { endsAt: null, startsAt: { gte: start } },
        ],
      },
    ]);
  });
});

describe("not-ended semantics", () => {
  // Minimal evaluator for the not-ended clause, to check real events.
  const visible = (e: { startsAt: Date; endsAt: Date | null }) =>
    e.endsAt ? e.endsAt >= now : e.startsAt >= now;
  it("keeps an in-progress event (started 1h ago, ends in 1h)", () => {
    const hour = 3600_000;
    const e = {
      startsAt: new Date(now.getTime() - hour),
      endsAt: new Date(now.getTime() + hour),
    };
    expect(visible(e)).toBe(true);
    // ...and it stays visible under a from bound of today
    const w = buildWhere({ page: 1, from: "2026-11-05" }, now);
    const startBound = new Date("2026-11-04T21:00:00Z");
    expect(w.AND).toContainEqual({
      OR: [
        { endsAt: { gte: startBound } },
        { endsAt: null, startsAt: { gte: startBound } },
      ],
    });
    expect(e.endsAt >= startBound).toBe(true);
  });
  it("hides an ended event", () => {
    expect(
      visible({
        startsAt: new Date(now.getTime() - 7200_000),
        endsAt: new Date(now.getTime() - 1),
      }),
    ).toBe(false);
  });
});

describe("escapeLike / clampPage", () => {
  it("escapes LIKE wildcards in search", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
    const w = buildWhere({ page: 1, q: "100%" }, now);
    expect(JSON.stringify(w.AND)).toContain('"contains":"100\\\\%"');
  });
  it("clamps page into range", () => {
    expect(clampPage(5, 21)).toBe(2);
    expect(clampPage(0, 0)).toBe(1);
    expect(clampPage(1, 100)).toBe(1);
  });
});

describe("toQueryString / totalPages", () => {
  it("keeps filters, repeats type, and sets page", () => {
    expect(
      toQueryString(
        { page: 1, type: ["meetup", "workshop"], range: "week" },
        { page: 2 },
      ),
    ).toBe("?type=meetup&type=workshop&range=week&page=2");
    expect(toQueryString({ page: 1 })).toBe("");
  });
  it("round-trips through parseFilters", () => {
    const f = parseFilters({ type: ["meetup", "workshop"], format: "online" });
    const sp = new URLSearchParams(toQueryString(f));
    expect(parseFilters({ type: sp.getAll("type"), format: "online" })).toEqual(
      f,
    );
  });
  it("counts pages", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(20)).toBe(1);
    expect(totalPages(21)).toBe(2);
  });
});

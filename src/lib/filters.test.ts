import { describe, expect, it } from "vitest";
import { buildWhere, parseFilters, toQueryString, totalPages } from "./filters";

const now = new Date("2026-11-05T09:00:00Z");

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
      type: "meetup",
      format: "online",
      from: "2026-11-10",
      to: "2026-11-20",
      page: 3,
    });
  });
  it("drops invalid values", () => {
    expect(
      parseFilters({
        type: "party",
        format: "x",
        from: "nope",
        page: "-2",
        q: "",
      }),
    ).toEqual({ page: 1 });
  });
  it("uses the first of repeated params", () => {
    expect(parseFilters({ type: ["workshop", "meetup"] }).type).toBe(
      "workshop",
    );
  });
});

describe("buildWhere", () => {
  it("only shows approved upcoming events", () => {
    expect(buildWhere({ page: 1 }, now)).toEqual({
      status: "approved",
      startsAt: { gte: now },
    });
  });
  it("applies type, format and search", () => {
    const w = buildWhere(
      { page: 1, type: "hackathon", format: "in-person", q: "ai" },
      now,
    );
    expect(w.type).toBe("hackathon");
    expect(w.isOnline).toBe(false);
    expect(w.OR).toHaveLength(4);
  });
  it("uses Nairobi day bounds for the date range", () => {
    const w = buildWhere(
      { page: 1, from: "2026-11-10", to: "2026-11-10" },
      now,
    );
    expect(w.startsAt).toEqual({
      gte: new Date("2026-11-09T21:00:00Z"),
      lt: new Date("2026-11-10T21:00:00Z"),
    });
  });
  it("never shows past events even if from is in the past", () => {
    const w = buildWhere({ page: 1, from: "2020-01-01" }, now);
    expect(w.startsAt).toEqual({ gte: now });
  });
});

describe("toQueryString / totalPages", () => {
  it("keeps filters and sets page", () => {
    expect(toQueryString({ page: 1, type: "meetup" }, { page: 2 })).toBe(
      "?type=meetup&page=2",
    );
    expect(toQueryString({ page: 1 })).toBe("");
  });
  it("counts pages", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(20)).toBe(1);
    expect(totalPages(21)).toBe(2);
  });
});

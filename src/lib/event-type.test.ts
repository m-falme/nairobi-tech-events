import { describe, expect, it } from "vitest";
import { typeBadgeClass, typeLabel } from "./event-type";
import { formatCardDate } from "./format";

describe("event type badge", () => {
  it("has distinct classes per type and falls back to other", () => {
    const set = new Set(
      ["hackathon", "meetup", "workshop", "conference", "other"].map(
        typeBadgeClass,
      ),
    );
    expect(set.size).toBe(5);
    expect(typeBadgeClass("weird")).toBe(typeBadgeClass("other"));
  });
  it("labels", () => {
    expect(typeLabel("meetup")).toBe("Meetup");
  });
});

describe("formatCardDate", () => {
  it("formats dd/mm/yyyy in EAT", () => {
    expect(formatCardDate(new Date("2026-01-31T21:30:00Z"))).toBe(
      "01/02/2026 · 00:30 EAT",
    );
  });
});

import { formatIsoDay } from "./format";
describe("formatIsoDay", () => {
  it("converts", () => {
    expect(formatIsoDay("2026-11-05")).toBe("05/11/2026");
    expect(formatIsoDay("bad")).toBe("bad");
  });
});

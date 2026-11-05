import { describe, expect, it } from "vitest";
import { DEFAULT_DURATION_MS, eventPhase } from "./event-phase";

const start = new Date("2026-11-10T15:00:00Z");
const end = new Date("2026-11-10T18:00:00Z");
const at = (iso: string) => new Date(iso);

describe("eventPhase", () => {
  it("is upcoming before the start", () => {
    expect(eventPhase(start, end, at("2026-11-10T14:59:59Z"))).toBe("upcoming");
  });
  it("is live from the start until the end", () => {
    expect(eventPhase(start, end, start)).toBe("live");
    expect(eventPhase(start, end, at("2026-11-10T17:59:59Z"))).toBe("live");
  });
  it("has ended at and after the end", () => {
    expect(eventPhase(start, end, end)).toBe("ended");
    expect(eventPhase(start, end, at("2026-12-01T00:00:00Z"))).toBe("ended");
  });
  it("assumes a default duration when there is no end time", () => {
    const justBefore = new Date(start.getTime() + DEFAULT_DURATION_MS - 1);
    expect(eventPhase(start, null, justBefore)).toBe("live");
    expect(
      eventPhase(start, null, new Date(start.getTime() + DEFAULT_DURATION_MS)),
    ).toBe("ended");
  });
});

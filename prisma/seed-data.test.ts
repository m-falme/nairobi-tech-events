import { describe, expect, it } from "vitest";
import { seedEvents, seedSources } from "./seed-data";

describe("seed data", () => {
  it("has 4 sources and 10 events", () => {
    expect(seedSources).toHaveLength(4);
    expect(seedEvents).toHaveLength(10);
  });

  it("covers all four main event types and mixes statuses", () => {
    const types = new Set(seedEvents.map((e) => e.type));
    for (const t of ["hackathon", "meetup", "workshop", "conference"])
      expect(types).toContain(t);
    expect(new Set(seedEvents.map((e) => e.status)).size).toBeGreaterThan(1);
  });

  it("has valid dates, URLs and source references", () => {
    const keys = new Set(seedSources.map((s) => s.key));
    for (const e of seedEvents) {
      const start = new Date(e.startsAt);
      expect(Number.isNaN(start.getTime())).toBe(false);
      if (e.endsAt)
        expect(new Date(e.endsAt).getTime()).toBeGreaterThan(start.getTime());
      expect(() => new URL(e.url)).not.toThrow();
      if (e.sourceKey) expect(keys).toContain(e.sourceKey);
    }
  });

  it("has unique external ids per source", () => {
    const pairs = seedEvents
      .filter((e) => e.externalId)
      .map((e) => `${e.sourceKey}:${e.externalId}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("has unique source keys and only allowlisted Luma feeds", async () => {
    const { isImportAllowed } = await import("../src/lib/importer/allowlist");
    expect(new Set(seedSources.map((s) => s.key)).size).toBe(
      seedSources.length,
    );
    const luma = seedSources.filter((s) => s.key.startsWith("luma:"));
    expect(luma).toHaveLength(2);
    for (const s of luma)
      expect(isImportAllowed({ ...s, active: true })).toBe(true);
  });
});

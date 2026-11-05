import { describe, expect, it } from "vitest";
import { lumaIcsUrl } from "./importer/allowlist";
import { toPublicSource } from "./public-sources";

const base = { id: "1", name: "X", kind: "ical", active: true };

describe("toPublicSource", () => {
  it("links approved Luma feeds to the public calendar page", () => {
    const p = toPublicSource({
      ...base,
      name: "Tech Kenya",
      url: lumaIcsUrl("cal-tNFqmDwu6YpmOOJ"),
    });
    expect(p).toEqual({
      id: "1",
      name: "Tech Kenya",
      method: "Official iCal feed",
      status: "Approved for import",
      link: "https://luma.com/techkenya",
    });
  });
  it("marks non-allowlisted and inactive sources", () => {
    expect(
      toPublicSource({ ...base, kind: "rss", url: "https://e.com/feed" }),
    ).toMatchObject({
      method: "Official RSS feed",
      status: "Not imported",
      link: "https://e.com/feed",
    });
    expect(
      toPublicSource({
        ...base,
        active: false,
        url: lumaIcsUrl("cal-Cpt1V9LBIY4ETmr"),
      }).status,
    ).toBe("Paused");
  });
  it("drops non-http links and never exposes extra fields", () => {
    const p = toPublicSource({
      ...base,
      url: "javascript:alert(1)",
      lastError: "secret detail",
      termsNote: "x",
    } as Parameters<typeof toPublicSource>[0]);
    expect(p.link).toBeNull();
    expect(Object.keys(p).sort()).toEqual([
      "id",
      "link",
      "method",
      "name",
      "status",
    ]);
  });
});

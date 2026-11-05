import { describe, expect, it } from "vitest";
import {
  eatDay,
  findDuplicates,
  normaliseUrl,
  titleSimilarity,
} from "./duplicates";

const ev = (id: string, title: string, url: string, startsAt: string) => ({
  id,
  title,
  url,
  startsAt: new Date(startsAt),
});

const target = ev(
  "p1",
  "Nairobi JS Meetup: November",
  "https://lu.ma/njs-nov",
  "2026-11-10T15:00:00Z",
);

describe("normaliseUrl", () => {
  it("ignores www, trailing slash, hash and utm params", () => {
    expect(normaliseUrl("https://www.lu.ma/njs-nov/?utm_source=x#top")).toBe(
      normaliseUrl("http://lu.ma/njs-nov"),
    );
  });
  it("keeps meaningful query params", () => {
    expect(normaliseUrl("https://x.com/e?id=1")).not.toBe(
      normaliseUrl("https://x.com/e?id=2"),
    );
  });
});

describe("titleSimilarity", () => {
  it("is 1 for the same words in any case or punctuation", () => {
    expect(titleSimilarity("Nairobi JS Meetup!", "nairobi js meetup")).toBe(1);
  });
  it("is low for different events", () => {
    expect(titleSimilarity("Flutter Workshop", "AI Hackathon")).toBe(0);
  });
});

describe("eatDay", () => {
  it("uses the Nairobi calendar day", () => {
    expect(eatDay(new Date("2026-11-09T21:30:00Z"))).toBe("2026-11-10");
    expect(eatDay(new Date("2026-11-09T20:59:00Z"))).toBe("2026-11-09");
  });
});

describe("findDuplicates", () => {
  it("flags the same URL on any day", () => {
    const other = ev(
      "a",
      "Totally different",
      "https://www.lu.ma/njs-nov/",
      "2026-12-01T10:00:00Z",
    );
    expect(findDuplicates(target, [other])).toEqual([
      { id: "a", title: "Totally different", reason: "same-url" },
    ]);
  });
  it("flags a similar title on the same EAT day", () => {
    const other = ev(
      "b",
      "Nairobi JS Meetup November",
      "https://meetup.com/x",
      "2026-11-10T06:00:00Z",
    );
    expect(findDuplicates(target, [other])[0]?.reason).toBe("similar-title");
  });
  it("counts a late-night UTC time as the next EAT day", () => {
    // 21:30 UTC on 9 Nov = 00:30 EAT on 10 Nov
    const other = ev(
      "c",
      "Nairobi JS Meetup - November",
      "https://x.org",
      "2026-11-09T21:30:00Z",
    );
    expect(findDuplicates(target, [other])).toHaveLength(1);
  });
  it("ignores a similar title on a different EAT day", () => {
    const other = ev(
      "d",
      "Nairobi JS Meetup November",
      "https://x.org",
      "2026-11-11T09:00:00Z",
    );
    expect(findDuplicates(target, [other])).toEqual([]);
  });
  it("ignores a dissimilar title on the same day", () => {
    const other = ev(
      "e",
      "Cloud Security Workshop",
      "https://x.org",
      "2026-11-10T09:00:00Z",
    );
    expect(findDuplicates(target, [other])).toEqual([]);
  });
  it("never flags the event itself", () => {
    expect(findDuplicates(target, [target])).toEqual([]);
  });
});

describe("same-URL across dates (queue scenario)", () => {
  it("flags an approved 2029 event with www + trailing slash", () => {
    const pending = ev(
      "p",
      "Var Meetup",
      "https://var.ke/e",
      "2026-11-10T15:00:00Z",
    );
    const approved = ev(
      "x",
      "Something else",
      "https://www.var.ke/e/",
      "2029-03-01T10:00:00Z",
    );
    expect(findDuplicates(pending, [approved])).toEqual([
      { id: "x", title: "Something else", reason: "same-url" },
    ]);
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  buildEventMetadata,
  findPublicEvent,
  isUuid,
  summarise,
  type DetailEvent,
} from "./event-detail";

const id = "3f1c2b8e-1d2a-4c5b-9e7f-0a1b2c3d4e5f";
const base: DetailEvent = {
  id,
  title: "Nairobi JS Meetup",
  description: "Talks on React\n\nand Node.",
  startsAt: new Date("2026-11-10T15:00:00Z"),
  endsAt: null,
  venue: "iHub",
  isOnline: false,
  type: "meetup",
  url: "https://lu.ma/x",
  organiser: "NairobiJS",
  status: "approved",
  source: null,
};

describe("findPublicEvent (404 logic)", () => {
  it("returns an approved event", async () => {
    expect(await findPublicEvent(id, async () => base)).toBe(base);
  });
  it("returns null for an unknown id", async () => {
    expect(await findPublicEvent(id, async () => null)).toBeNull();
  });
  it.each(["pending", "rejected"])("returns null when %s", async (status) => {
    expect(
      await findPublicEvent(id, async () => ({ ...base, status })),
    ).toBeNull();
  });
  it("does not query the DB for a non-UUID id", async () => {
    const fetch = vi.fn();
    expect(await findPublicEvent("not-a-uuid", fetch)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("validates UUIDs", () => {
    expect(isUuid(id)).toBe(true);
    expect(isUuid("1; drop table")).toBe(false);
  });
});

describe("buildEventMetadata", () => {
  it("builds text-only Open Graph tags", () => {
    const m = buildEventMetadata(base, "https://example.org");
    expect(m.title).toBe("Nairobi JS Meetup · Nairobi Tech Events");
    expect(m.description).toBe("Talks on React and Node.");
    expect(m.openGraph).toEqual({
      type: "website",
      siteName: "Nairobi Tech Events",
      title: "Nairobi JS Meetup",
      description: "Talks on React and Node.",
      url: `https://example.org/events/${id}`,
    });
    expect(m.openGraph).not.toHaveProperty("images");
    expect(m.alternates?.canonical).toBe(`https://example.org/events/${id}`);
  });
  it("falls back when there is no description", () => {
    const m = buildEventMetadata({ ...base, description: "" }, "https://e.org");
    expect(m.description).toBe("Nairobi JS Meetup on Nairobi Tech Events");
  });
  it("handles a missing event", () => {
    const m = buildEventMetadata(null, "https://e.org");
    expect(m.title).toBe("Event not found · Nairobi Tech Events");
    expect(m.openGraph).toBeUndefined();
  });
  it("truncates long descriptions", () => {
    const s = summarise("a".repeat(500));
    expect(s.length).toBe(200);
    expect(s.endsWith("…")).toBe(true);
  });
});

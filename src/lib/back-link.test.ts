import { describe, expect, it } from "vitest";
import { parseQueryString, toQueryString } from "./filters";
import { formatEndDate } from "./format";

describe("parseQueryString (detail back link)", () => {
  it("keeps every repeated type plus a from/to range", () => {
    const f = parseQueryString(
      "type=meetup&type=workshop&type=hackathon&from=2026-11-01&to=2026-11-30",
    );
    expect(f.type).toEqual(["meetup", "workshop", "hackathon"]);
    expect(f.from).toBe("2026-11-01");
    expect(f.to).toBe("2026-11-30");
    expect(toQueryString(f)).toBe(
      "?type=meetup&type=workshop&type=hackathon&from=2026-11-01&to=2026-11-30",
    );
  });
  it("drops a bogus type but keeps the valid one", () => {
    expect(parseQueryString("type=meetup&type=bogus").type).toEqual(["meetup"]);
  });
});

describe("formatEndDate", () => {
  const start = new Date("2026-11-05T15:00:00Z");
  it("same EAT day shows time only", () => {
    expect(formatEndDate(start, new Date("2026-11-05T18:00:00Z"))).toBe(
      "21:00 EAT",
    );
  });
  it("other day shows full date", () => {
    expect(formatEndDate(start, new Date("2026-11-06T18:00:00Z"))).toBe(
      "06/11/2026 · 21:00 EAT",
    );
  });
});

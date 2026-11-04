import { describe, expect, it } from "vitest";
import { safeHref } from "./url";

describe("safeHref", () => {
  it("allows https URLs", () => {
    expect(safeHref("https://lu.ma/abc")).toBe("https://lu.ma/abc");
  });
  it("allows http URLs", () => {
    expect(safeHref("http://example.com/")).toBe("http://example.com/");
  });
  it("rejects javascript: URLs", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref(" JavaScript:alert(1)")).toBeNull();
  });
  it("rejects data: URLs", () => {
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBeNull();
  });
  it("rejects relative and empty values", () => {
    expect(safeHref("/events/1")).toBeNull();
    expect(safeHref("")).toBeNull();
    expect(safeHref(null)).toBeNull();
  });
});

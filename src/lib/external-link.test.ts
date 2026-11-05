import { describe, expect, it } from "vitest";
import { EXTERNAL_LINK_PROPS, NEW_TAB_TEXT } from "./external-link";

describe("external links", () => {
  it("open in a new tab without opener or referrer", () => {
    expect(EXTERNAL_LINK_PROPS).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });
  it("announce the new tab to screen readers", () => {
    expect(NEW_TAB_TEXT).toBe(" (opens in new tab)");
  });
});

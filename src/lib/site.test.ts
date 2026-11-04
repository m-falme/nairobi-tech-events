import { describe, expect, it } from "vitest";
import { SITE_NAME } from "./site";

describe("site", () => {
  it("has the right name", () => {
    expect(SITE_NAME).toBe("Nairobi Tech Events");
  });
});

import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind classes without duplicates", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", false && "hidden", "font-bold")).toBe(
      "text-red-500 font-bold",
    );
  });
});

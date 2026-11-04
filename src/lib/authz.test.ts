import { describe, expect, it } from "vitest";
import { assertAdmin, isAdmin, UnauthorizedError } from "./authz";

describe("authz guard", () => {
  it("accepts an admin session", () => {
    const s = { user: { email: "admin@example.com", role: "admin" } };
    expect(isAdmin(s)).toBe(true);
    expect(() => assertAdmin(s)).not.toThrow();
  });
  it.each([
    ["no session", null],
    ["undefined", undefined],
    ["no user", {}],
    ["no role", { user: { email: "a@b.co" } }],
    ["wrong role", { user: { email: "a@b.co", role: "user" } }],
    ["no email", { user: { role: "admin" } }],
  ])("rejects %s", (_name, s) => {
    expect(isAdmin(s)).toBe(false);
    expect(() => assertAdmin(s)).toThrow(UnauthorizedError);
  });
});

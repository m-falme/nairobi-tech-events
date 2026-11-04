import { describe, expect, it } from "vitest";
import {
  editSchema,
  formToObject,
  idSchema,
  loginSchema,
  toEatInput,
} from "./review";

const id = "3f1c2b8e-1d2a-4c5b-9e7f-0a1b2c3d4e5f";
const valid = {
  id,
  title: "  Nairobi JS  ",
  description: "Talks",
  startsAt: "2026-11-10T18:00",
  endsAt: "",
  venue: "",
  organiser: "NairobiJS",
  type: "meetup",
  url: "https://lu.ma/x",
};

describe("idSchema", () => {
  it("requires a UUID", () => {
    expect(idSchema.safeParse({ id }).success).toBe(true);
    expect(idSchema.safeParse({ id: "1 OR 1=1" }).success).toBe(false);
    expect(idSchema.safeParse({}).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("normalises email and requires a password", () => {
    expect(
      loginSchema.parse({ email: " Admin@Example.com ", password: "x" }).email,
    ).toBe("admin@example.com");
    expect(
      loginSchema.safeParse({ email: "admin@example.com", password: "" })
        .success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "nope", password: "x" }).success,
    ).toBe(false);
  });
});

describe("editSchema", () => {
  it("parses a valid edit, reading times as EAT", () => {
    const r = editSchema.parse(valid);
    expect(r.title).toBe("Nairobi JS");
    expect(r.startsAt).toEqual(new Date("2026-11-10T15:00:00Z"));
    expect(r.endsAt).toBeNull();
    expect(r.venue).toBeNull();
    expect(r.isOnline).toBe(false);
  });
  it("reads the online checkbox", () => {
    expect(editSchema.parse({ ...valid, isOnline: "on" }).isOnline).toBe(true);
  });
  it.each([
    ["javascript URL", { url: "javascript:alert(1)" }],
    ["data URL", { url: "data:text/html,x" }],
    ["empty title", { title: "  " }],
    ["bad type", { type: "party" }],
    ["bad start", { startsAt: "tomorrow" }],
    ["end before start", { endsAt: "2026-11-10T17:00" }],
    ["bad id", { id: "x" }],
  ])("rejects %s", (_n, patch) => {
    expect(editSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("formToObject drops Next internal $ fields", () => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("$ACTION_ID_abc", "");
    expect(formToObject(fd)).toEqual({ id });
  });
  it("toEatInput round-trips with editSchema", () => {
    const d = new Date("2026-11-10T15:00:00Z");
    expect(toEatInput(d)).toBe("2026-11-10T18:00");
  });
});

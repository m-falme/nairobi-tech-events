import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "./authz";
import { addSourceCore } from "./sources-admin";

const admin = { user: { email: "a@x.org", role: "admin" } };
const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  return fd;
};

describe("addSourceCore", () => {
  it("creates a source for the admin", async () => {
    const create = vi.fn(async () => ({}));
    const r = await addSourceCore(
      { getSession: async () => admin, db: { source: { create } } },
      form({
        name: "X",
        kind: "ical",
        url: "https://x.org/a.ics",
        trusted: "on",
      }),
    );
    expect(r).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "X",
        kind: "ical",
        url: "https://x.org/a.ics",
        trusted: true,
        active: true,
      }),
    });
  });
  it("validates kind and URL without throwing", async () => {
    const create = vi.fn();
    const r = await addSourceCore(
      { getSession: async () => admin, db: { source: { create } } },
      form({ name: "", kind: "manual", url: "notaurl" }),
    );
    expect(Object.keys(r.errors ?? {}).sort()).toEqual(["kind", "name", "url"]);
    expect(create).not.toHaveBeenCalled();
  });
  it("rejects non-admins", async () => {
    await expect(
      addSourceCore(
        { getSession: async () => null, db: { source: { create: vi.fn() } } },
        form({}),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

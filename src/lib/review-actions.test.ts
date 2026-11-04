import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "./authz";
import {
  editAndApproveCore,
  setStatusCore,
  type ReviewDeps,
} from "./review-actions";

const id = "3f1c2b8e-1d2a-4c5b-9e7f-0a1b2c3d4e5f";
const admin = { user: { email: "admin@example.com", role: "admin" } };

function deps(session: unknown, count = 1) {
  const updateMany = vi.fn().mockResolvedValue({ count });
  return {
    d: {
      getSession: async () => session,
      db: { event: { updateMany } },
    } as ReviewDeps,
    updateMany,
  };
}

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const edit = {
  id,
  title: "Nairobi JS",
  description: "",
  startsAt: "2026-11-10T18:00",
  endsAt: "",
  venue: "",
  organiser: "",
  type: "meetup",
  url: "https://lu.ma/x",
};

describe("unauthenticated calls are refused", () => {
  it.each([null, {}, { user: { email: "a@b.co", role: "user" } }])(
    "setStatusCore and editAndApproveCore throw for %j without touching the DB",
    async (session) => {
      const { d, updateMany } = deps(session);
      await expect(
        setStatusCore(d, form({ id }), "approved"),
      ).rejects.toBeInstanceOf(UnauthorizedError);
      await expect(
        setStatusCore(d, form({ id }), "rejected"),
      ).rejects.toBeInstanceOf(UnauthorizedError);
      await expect(editAndApproveCore(d, form(edit))).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
      expect(updateMany).not.toHaveBeenCalled();
    },
  );
});

describe("setStatusCore", () => {
  it("only updates pending rows", async () => {
    const { d, updateMany } = deps(admin);
    expect(await setStatusCore(d, form({ id }), "rejected")).toEqual({
      ok: true,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id, status: "pending" },
      data: { status: "rejected" },
    });
  });
  it("rejects a bad id without a DB call", async () => {
    const { d, updateMany } = deps(admin);
    expect((await setStatusCore(d, form({ id: "x" }), "approved")).ok).toBe(
      false,
    );
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("errors when the event is no longer pending", async () => {
    const { d } = deps(admin, 0);
    expect((await setStatusCore(d, form({ id }), "approved")).error).toMatch(
      /no longer pending/,
    );
  });
});

describe("editAndApproveCore", () => {
  it("updates only a pending event and approves it", async () => {
    const { d, updateMany } = deps(admin);
    expect(await editAndApproveCore(d, form(edit))).toEqual({ ok: true });
    const arg = updateMany.mock.calls[0][0];
    expect(arg.where).toEqual({ id, status: "pending" });
    expect(arg.data.status).toBe("approved");
    expect(arg.data.startsAt).toEqual(new Date("2026-11-10T15:00:00Z"));
  });
  it("returns an error when count is 0 (already reviewed)", async () => {
    const { d } = deps(admin, 0);
    const r = await editAndApproveCore(d, form(edit));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no longer pending/);
  });
  it("returns field errors for invalid input, e.g. notaurl", async () => {
    const { d, updateMany } = deps(admin);
    const r = await editAndApproveCore(d, form({ ...edit, url: "notaurl" }));
    expect(r.ok).toBe(false);
    expect(r.errors?.url).toBeDefined();
    expect(updateMany).not.toHaveBeenCalled();
  });
});

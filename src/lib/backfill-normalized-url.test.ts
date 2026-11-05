import { describe, expect, it } from "vitest";
import {
  backfillNormalizedUrls,
  type BackfillDb,
} from "./backfill-normalized-url";

function fakeDb(
  rows: { id: string; url: string; normalizedUrl: string | null }[],
) {
  const db: BackfillDb = {
    event: {
      findMany: async ({ take }) =>
        rows
          .filter((r) => r.normalizedUrl === null)
          .slice(0, take)
          .map(({ id, url }) => ({ id, url })),
      update: async ({ where, data }) =>
        Object.assign(
          rows.find((r) => r.id === where.id)!,
          data,
        ),
    },
  };
  return db;
}

describe("backfillNormalizedUrls", () => {
  it("fills only NULL rows, in batches, using normaliseUrl", async () => {
    const rows = [
      {
        id: "1",
        url: "https://www.lu.ma/a/?utm_source=x#h",
        normalizedUrl: null,
      },
      { id: "2", url: "https://Meetup.com/b/", normalizedUrl: null },
      { id: "3", url: "https://x.org/c", normalizedUrl: "keep" },
    ];
    expect(await backfillNormalizedUrls(fakeDb(rows), 1)).toBe(2);
    expect(rows.map((r) => r.normalizedUrl)).toEqual([
      "lu.ma/a",
      "meetup.com/b",
      "keep",
    ]);
  });
  it("is idempotent", async () => {
    const rows = [{ id: "1", url: "https://lu.ma/a", normalizedUrl: null }];
    const db = fakeDb(rows);
    await backfillNormalizedUrls(db);
    expect(await backfillNormalizedUrls(db)).toBe(0);
  });
});

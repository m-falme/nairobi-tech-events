import { normaliseUrl } from "./duplicates";

export type BackfillDb = {
  event: {
    findMany(args: {
      where: { normalizedUrl: null };
      select: { id: true; url: true };
      take: number;
    }): Promise<{ id: string; url: string }[]>;
    update(args: {
      where: { id: string };
      data: { normalizedUrl: string };
    }): Promise<unknown>;
  };
};

/**
 * Fill events.normalized_url where it is NULL, in batches, using the same
 * normaliser as the app. Idempotent; returns the number of rows updated.
 */
export async function backfillNormalizedUrls(
  db: BackfillDb,
  batch = 500,
): Promise<number> {
  let total = 0;
  for (;;) {
    const rows = await db.event.findMany({
      where: { normalizedUrl: null },
      select: { id: true, url: true },
      take: batch,
    });
    for (const r of rows)
      await db.event.update({
        where: { id: r.id },
        data: { normalizedUrl: normaliseUrl(r.url) },
      });
    total += rows.length;
    if (rows.length < batch) return total;
  }
}

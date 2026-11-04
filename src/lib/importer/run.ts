import type { EventStatus, ImportRunStatus } from "@prisma/client";
import { adapters as defaultAdapters } from "./adapters";
import { isImportAllowed } from "./allowlist";
import type {
  FetchText,
  ImportSource,
  ImportedEvent,
  SourceAdapter,
} from "./types";

export const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

type Key = { sourceId: string; externalId: string };

/** The subset of Prisma the importer uses (injectable for tests). */
export type ImportDb = {
  source: {
    findMany(args: { where: { active: true } }): Promise<ImportSource[]>;
    update(args: {
      where: { id: string };
      data: { lastFetchedAt?: Date; lastError?: string | null };
    }): Promise<unknown>;
  };
  importRun: {
    create(args: {
      data: {
        sourceId: string;
        startedAt: Date;
        status: ImportRunStatus;
        finishedAt?: Date;
        error?: string;
      };
    }): Promise<{ id: string }>;
    update(args: {
      where: { id: string };
      data: {
        finishedAt: Date;
        status: ImportRunStatus;
        added?: number;
        updated?: number;
        skipped?: number;
        error?: string | null;
      };
    }): Promise<unknown>;
  };
  event: {
    findUnique(args: {
      where: { sourceId_externalId: Key };
      select: { id: true; adminEditedAt: true };
    }): Promise<{ id: string; adminEditedAt: Date | null } | null>;
    create(args: {
      data: ImportedEvent & {
        sourceId: string;
        status: EventStatus;
        timezone: string;
      };
    }): Promise<unknown>;
    update(args: {
      where: { id: string };
      data: Omit<ImportedEvent, "externalId">;
    }): Promise<unknown>;
  };
};

export type ImportDeps = {
  db: ImportDb;
  fetchText: FetchText;
  now?: () => Date;
  adapters?: Partial<Record<string, SourceAdapter>>;
  log?: (msg: string) => void;
};

export type SourceResult = {
  sourceId: string;
  name: string;
  status: ImportRunStatus | "not-allowed";
  added: number;
  updated: number;
  skipped: number;
  error?: string;
};

const errMsg = (e: unknown) =>
  (e instanceof Error ? e.message : String(e)).slice(0, 500);

/** Import every active, allowlisted source; one failure never stops the run. */
export async function runImport(deps: ImportDeps): Promise<SourceResult[]> {
  const now = deps.now ?? (() => new Date());
  const log = deps.log ?? (() => {});
  const adapters = deps.adapters ?? defaultAdapters;
  const results: SourceResult[] = [];
  const sources = await deps.db.source.findMany({ where: { active: true } });

  for (const source of sources) {
    const base = { sourceId: source.id, name: source.name };
    if (!isImportAllowed(source)) {
      results.push({
        ...base,
        status: "not-allowed",
        added: 0,
        updated: 0,
        skipped: 0,
      });
      continue;
    }
    const started = now();
    if (
      source.lastFetchedAt &&
      started.getTime() - source.lastFetchedAt.getTime() < MIN_INTERVAL_MS
    ) {
      await deps.db.importRun.create({
        data: {
          sourceId: source.id,
          startedAt: started,
          finishedAt: started,
          status: "skipped",
          error: "Fetched less than 6 hours ago",
        },
      });
      results.push({
        ...base,
        status: "skipped",
        added: 0,
        updated: 0,
        skipped: 0,
      });
      continue;
    }

    const run = await deps.db.importRun.create({
      data: { sourceId: source.id, startedAt: started, status: "running" },
    });
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let unchanged = 0;
    try {
      const adapter = adapters[source.kind];
      if (!adapter) throw new Error(`No adapter for ${source.kind}`);
      const items = await adapter.load(source, deps.fetchText);
      for (const item of items) {
        try {
          const { externalId, ...fields } = item;
          const existing = await deps.db.event.findUnique({
            where: { sourceId_externalId: { sourceId: source.id, externalId } },
            select: { id: true, adminEditedAt: true },
          });
          if (existing?.adminEditedAt) {
            // An admin edited this event: keep their text/times untouched.
            unchanged++;
          } else if (existing) {
            // Refresh text/time fields; never override an admin's status.
            await deps.db.event.update({
              where: { id: existing.id },
              data: fields,
            });
            updated++;
          } else {
            await deps.db.event.create({
              data: {
                ...item,
                sourceId: source.id,
                timezone: "Africa/Nairobi",
                status: source.trusted ? "approved" : "pending",
              },
            });
            added++;
          }
        } catch (e) {
          skipped++;
          log(`[${source.name}] skipped item ${item.externalId}: ${errMsg(e)}`);
        }
      }
      await deps.db.importRun.update({
        where: { id: run.id },
        data: { finishedAt: now(), status: "success", added, updated, skipped },
      });
      await deps.db.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: started, lastError: null },
      });
      results.push({ ...base, status: "success", added, updated, skipped });
      log(
        `[${source.name}] added ${added}, updated ${updated}, kept admin edits ${unchanged}, skipped ${skipped}`,
      );
    } catch (e) {
      const error = errMsg(e);
      // lastFetchedAt is set on failure too, so a broken feed is not hammered.
      await deps.db.importRun.update({
        where: { id: run.id },
        data: {
          finishedAt: now(),
          status: "failed",
          added,
          updated,
          skipped,
          error,
        },
      });
      await deps.db.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: started, lastError: error },
      });
      results.push({
        ...base,
        status: "failed",
        added,
        updated,
        skipped,
        error,
      });
      log(`[${source.name}] failed: ${error}`);
    }
  }
  return results;
}

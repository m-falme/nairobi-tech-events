import type { EventType, SourceKind } from "@prisma/client";

export type ImportSource = {
  id: string;
  name: string;
  kind: SourceKind;
  url: string | null;
  trusted: boolean;
  active: boolean;
  lastFetchedAt: Date | null;
};

/** A normalised, text-only event from a feed. */
export type ImportedEvent = {
  externalId: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  venue: string | null;
  isOnline: boolean;
  type: EventType;
  /** Official event page (link back). */
  url: string;
  organiser: string | null;
};

export type FetchText = (url: string) => Promise<string>;

export interface SourceAdapter {
  kind: SourceKind;
  /** Fetch (via the injected fetcher) and parse one source. */
  load(source: ImportSource, fetchText: FetchText): Promise<ImportedEvent[]>;
}

export class UnsupportedSourceError extends Error {}

import type { SourceKind } from "@prisma/client";
import { icalAdapter } from "./ical";
import { UnsupportedSourceError, type SourceAdapter } from "./types";

/** RSS is not approved for any source yet (Luma-only override); kept as a stub. */
export const rssAdapter: SourceAdapter = {
  kind: "rss",
  async load() {
    throw new UnsupportedSourceError("RSS import is not enabled");
  },
};

export const adapters: Partial<Record<SourceKind, SourceAdapter>> = {
  ical: icalAdapter,
  rss: rssAdapter,
};

import type { Metadata } from "next";
import { SITE_NAME } from "./site";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export type DetailEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  venue: string | null;
  isOnline: boolean;
  type: string;
  url: string;
  organiser: string | null;
  status: string;
  source: { name: string } | null;
};

/**
 * Load an event for the public detail page. Returns null (→ 404) when the
 * id is not a UUID, the event does not exist, or it is not approved.
 */
export async function findPublicEvent(
  id: string,
  fetch: (id: string) => Promise<DetailEvent | null>,
): Promise<DetailEvent | null> {
  if (!isUuid(id)) return null;
  const event = await fetch(id);
  if (!event || event.status !== "approved") return null;
  return event;
}

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Plain-text summary for meta tags, collapsed and cut to ~200 chars. */
export function summarise(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

export function buildEventMetadata(
  event: Pick<DetailEvent, "id" | "title" | "description"> | null,
  base: string = siteUrl(),
): Metadata {
  if (!event) return { title: `Event not found · ${SITE_NAME}` };
  const url = `${base}/events/${event.id}`;
  const description =
    summarise(event.description) || `${event.title} on ${SITE_NAME}`;
  return {
    title: `${event.title} · ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: event.title,
      description,
      url,
    },
  };
}

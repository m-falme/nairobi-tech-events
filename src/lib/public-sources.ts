import { approvedLumaCalendar, isImportAllowed } from "./importer/allowlist";
import { safeHref } from "./url";

/** Public calendar pages for approved Luma calendars (see SOURCES.md). */
export const LUMA_CALENDAR_PAGES: Record<string, string> = {
  "cal-tNFqmDwu6YpmOOJ": "https://luma.com/techkenya",
  "cal-Cpt1V9LBIY4ETmr": "https://luma.com/quantumke",
};

export type PublicSource = {
  id: string;
  name: string;
  method: string;
  status: string;
  link: string | null;
};

const METHOD: Record<string, string> = {
  ical: "Official iCal feed",
  rss: "Official RSS feed",
  api: "Official API",
  manual: "Manual entry",
};

/**
 * Public view of a sources row: name, method, status and a link only.
 * Never exposes lastError, terms notes, trust flags or raw feed URLs for
 * non-allowlisted sources.
 */
export function toPublicSource(s: {
  id: string;
  name: string;
  kind: string;
  url: string | null;
  active: boolean;
}): PublicSource {
  const cal = approvedLumaCalendar(s.url);
  const status = !s.active
    ? "Paused"
    : isImportAllowed(s)
      ? "Approved for import"
      : "Not imported";
  const link = cal ? (LUMA_CALENDAR_PAGES[cal] ?? null) : safeHref(s.url);
  return {
    id: s.id,
    name: s.name,
    method: METHOD[s.kind] ?? s.kind,
    status,
    link,
  };
}

/** Summary of SOURCES.md: how each platform is used. Keep in sync. */
export const PLATFORM_SUMMARY = [
  {
    platform: "Luma",
    method: "Official iCal feeds for approved calendars, text only",
    link: "https://luma.com",
  },
  {
    platform: "GDG (Google Developer Groups)",
    method: "Manual entry and community submissions",
    link: "https://gdg.community.dev",
  },
  {
    platform: "Meetup",
    method: "Manual entry and community submissions",
    link: "https://www.meetup.com",
  },
  {
    platform: "Eventbrite",
    method: "Manual entry and community submissions",
    link: "https://www.eventbrite.com",
  },
] as const;

/**
 * Approved import sources (SOURCES.md, "Approved overrides for PR 8").
 * Only Luma iCal feeds for these calendars may be fetched. Adding a calendar
 * here requires an approval recorded in SOURCES.md first.
 */
export const APPROVED_LUMA_CALENDARS = {
  "cal-tNFqmDwu6YpmOOJ": "Tech Kenya Events Calendar",
  "cal-Cpt1V9LBIY4ETmr": "QuantumKE",
} as const;

export const lumaIcsUrl = (calendarId: string) =>
  `https://api.lu.ma/ics/get?entity=calendar&id=${calendarId}`;

/** Returns the approved Luma calendar id for a feed URL, or null. */
export function approvedLumaCalendar(url: string | null): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.hostname !== "api.lu.ma") return null;
  if (u.pathname !== "/ics/get" || u.searchParams.get("entity") !== "calendar")
    return null;
  const id = u.searchParams.get("id") ?? "";
  return Object.hasOwn(APPROVED_LUMA_CALENDARS, id) ? id : null;
}

/** Whether the importer may fetch this source at all. */
export function isImportAllowed(source: {
  kind: string;
  url: string | null;
  active: boolean;
}): boolean {
  return (
    source.active &&
    source.kind === "ical" &&
    approvedLumaCalendar(source.url) !== null
  );
}

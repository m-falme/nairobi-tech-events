import ical from "node-ical";
import type { EventType } from "@prisma/client";
import { toPlainText } from "./text";
import type { ImportedEvent, SourceAdapter } from "./types";

type Param = string | { val?: unknown } | undefined | null;
const str = (v: unknown): string => {
  const p = v as Param;
  if (typeof p === "string") return p;
  if (p && typeof p === "object" && typeof p.val === "string") return p.val;
  return "";
};

const isHttp = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

const LUMA_LINK = /https?:\/\/(?:www\.)?(?:luma\.com|lu\.ma)\/[A-Za-z0-9_\-/]+/;

/** Official page: URL property if http(s), else the Luma link in the text. */
export function eventPageUrl(urlProp: string, description: string) {
  if (isHttp(urlProp)) return urlProp;
  const m = description.match(LUMA_LINK);
  return m ? m[0] : null;
}

export function inferType(title: string): EventType {
  const t = title.toLowerCase();
  if (/hack(athon|fest)?\b/.test(t)) return "hackathon";
  if (/workshop|bootcamp|masterclass|hands-on|training/.test(t))
    return "workshop";
  if (/conference|summit|\bcon\b|festival|expo/.test(t)) return "conference";
  if (/meetup|meet-up|mixer|networking|community/.test(t)) return "meetup";
  return "other";
}

const ONLINE =
  /zoom\.us|meet\.google|teams\.microsoft|youtube\.com|\bonline\b|virtual/i;

export function parseIcs(text: string): ImportedEvent[] {
  if (!/^\s*BEGIN:VCALENDAR/i.test(text))
    throw new Error("Response is not an iCal feed");
  const data = ical.sync.parseICS(text);
  const out: ImportedEvent[] = [];
  for (const item of Object.values(data)) {
    if (!item || item.type !== "VEVENT") continue;
    const ev = item as unknown as Record<string, unknown>;
    const uid = str(ev.uid).trim();
    const title = toPlainText(str(ev.summary), 200);
    const start = ev.start instanceof Date ? ev.start : null;
    if (!uid || !title || !start || Number.isNaN(start.getTime())) continue;
    if (str(ev.status).toUpperCase() === "CANCELLED") continue;
    const rawDesc = str(ev.description);
    const url = eventPageUrl(str(ev.url), rawDesc);
    if (!url) continue; // must be able to link back to the official page
    const end = ev.end instanceof Date && ev.end >= start ? ev.end : null;
    const location = str(ev.location).trim();
    const locIsUrl = isHttp(location);
    const organiserRaw = ev.organizer as Param & { params?: { CN?: string } };
    const organiser =
      (organiserRaw && typeof organiserRaw === "object"
        ? organiserRaw.params?.CN
        : undefined) ?? null;
    out.push({
      externalId: uid.slice(0, 255),
      title,
      description: toPlainText(rawDesc),
      startsAt: start,
      endsAt: end,
      venue: locIsUrl || !location ? null : toPlainText(location, 200) || null,
      isOnline: locIsUrl || ONLINE.test(location),
      type: inferType(title),
      url,
      organiser: organiser ? toPlainText(organiser, 200) || null : null,
    });
  }
  return out;
}

export const icalAdapter: SourceAdapter = {
  kind: "ical",
  async load(source, fetchText) {
    if (!source.url) throw new Error("Source has no URL");
    return parseIcs(await fetchText(source.url));
  },
};

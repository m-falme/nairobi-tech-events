export type DupCandidate = {
  id: string;
  title: string;
  url: string;
  startsAt: Date;
};

export type DupWarning = {
  id: string;
  title: string;
  reason: "same-url" | "similar-title";
};

const STOP = new Set(["the", "a", "an", "and", "of", "in", "at", "for", "to"]);

export function normaliseUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    for (const k of [...u.searchParams.keys()])
      if (k.startsWith("utm_")) u.searchParams.delete(k);
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.host.toLowerCase().replace(/^www\./, "")}${path}${u.search}`;
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(" ")
      .filter((t) => t && !STOP.has(t)),
  );
}

/** Jaccard similarity of title word sets, 0..1. */
export function titleSimilarity(a: string, b: string): number {
  const x = titleTokens(a);
  const y = titleTokens(b);
  if (!x.size || !y.size) return 0;
  let inter = 0;
  for (const t of x) if (y.has(t)) inter++;
  return inter / (x.size + y.size - inter);
}

export const SIMILARITY_THRESHOLD = 0.6;

/** Calendar day in Nairobi (EAT, UTC+3) as YYYY-MM-DD. */
export function eatDay(d: Date): string {
  return new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
}

/** Possible duplicates: same URL, or a similar title on the same EAT day. */
export function findDuplicates(
  event: DupCandidate,
  others: DupCandidate[],
): DupWarning[] {
  const url = normaliseUrl(event.url);
  const day = eatDay(event.startsAt);
  const out: DupWarning[] = [];
  for (const o of others) {
    if (o.id === event.id) continue;
    if (normaliseUrl(o.url) === url)
      out.push({ id: o.id, title: o.title, reason: "same-url" });
    else if (
      eatDay(o.startsAt) === day &&
      titleSimilarity(o.title, event.title) >= SIMILARITY_THRESHOLD
    )
      out.push({ id: o.id, title: o.title, reason: "similar-title" });
  }
  return out;
}

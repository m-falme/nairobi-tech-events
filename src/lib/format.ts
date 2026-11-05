const fmt = new Intl.DateTimeFormat("en-KE", {
  timeZone: "Africa/Nairobi",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatEventDate(d: Date): string {
  return `${fmt.format(d)} EAT`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Nairobi",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Nairobi",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Card date: dd/mm/yyyy · HH:mm EAT (display only). */
export function formatCardDate(d: Date): string {
  return `${dateFmt.format(d)} · ${timeFmt.format(d)} EAT`;
}

/** "yyyy-mm-dd" → "dd/mm/yyyy" (filter chips). */
export function formatIsoDay(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

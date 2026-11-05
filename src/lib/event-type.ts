/** Colour classes per event type; badge always shows text too. */
const BADGE: Record<string, string> = {
  hackathon:
    "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-800",
  meetup:
    "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-800",
  workshop:
    "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800",
  conference:
    "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800",
  other: "bg-muted text-foreground border-border",
};

export function typeBadgeClass(type: string): string {
  return BADGE[type] ?? BADGE.other;
}

export function typeLabel(type: string): string {
  return type ? type[0].toUpperCase() + type.slice(1) : "Other";
}

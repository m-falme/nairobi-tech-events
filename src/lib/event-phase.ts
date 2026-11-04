/** Assumed length of an event with no end time, for "Happening now"/"Ended". */
export const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

export type EventPhase = "upcoming" | "live" | "ended";

/**
 * Where an event is relative to `now`. Events without an end time are
 * treated as lasting DEFAULT_DURATION_MS.
 */
export function eventPhase(
  startsAt: Date,
  endsAt: Date | null,
  now: Date = new Date(),
): EventPhase {
  const end = endsAt ?? new Date(startsAt.getTime() + DEFAULT_DURATION_MS);
  if (now.getTime() >= end.getTime()) return "ended";
  if (now.getTime() >= startsAt.getTime()) return "live";
  return "upcoming";
}

export const PHASE_LABEL: Record<Exclude<EventPhase, "upcoming">, string> = {
  live: "Happening now",
  ended: "Ended",
};

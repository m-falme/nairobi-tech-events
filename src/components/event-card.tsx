import Link from "next/link";
import { typeBadgeClass, typeLabel } from "@/lib/event-type";
import { formatCardDate } from "@/lib/format";

type CardEvent = {
  id: string | number;
  title: string;
  type: string;
  startsAt: Date;
  isOnline: boolean;
  venue: string | null;
  organiser: string | null;
  source: { name: string } | null;
};

/** Whole card is one target: the title link stretches over the card. */
export function EventCard({ e, back = "" }: { e: CardEvent; back?: string }) {
  return (
    <article className="group relative flex h-full flex-col gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary/60 hover:bg-accent/40 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <span
        className={`w-fit rounded-full border px-2 py-0.5 text-xs font-medium ${typeBadgeClass(e.type)}`}
      >
        {typeLabel(e.type)}
      </span>
      <h2 className="text-lg font-semibold leading-snug">
        <Link
          href={`/events/${e.id}${back ? `?back=${encodeURIComponent(back)}` : ""}`}
          className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none group-hover:underline"
        >
          {e.title}
        </Link>
      </h2>
      <dl className="space-y-0.5 text-sm text-muted-foreground">
        <div>
          <dt className="sr-only">When</dt>
          <dd>
            <time dateTime={e.startsAt.toISOString()}>
              {formatCardDate(e.startsAt)}
            </time>
          </dd>
        </div>
        <div>
          <dt className="sr-only">Where</dt>
          <dd>{e.isOnline ? "Online" : (e.venue ?? "In person")}</dd>
        </div>
        <div>
          <dt className="sr-only">Source</dt>
          <dd>
            {e.source ? `via ${e.source.name}` : "Submitted"}
            {e.organiser && <> · By {e.organiser}</>}
          </dd>
        </div>
      </dl>
    </article>
  );
}

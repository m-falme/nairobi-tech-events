import { btnPrimary, focus, pageTitle, shell } from "@/lib/ui";
import { ExternalLink } from "@/components/external-link";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import {
  buildEventMetadata,
  findPublicEvent,
  type DetailEvent,
} from "@/lib/event-detail";
import { eventPhase, PHASE_LABEL } from "@/lib/event-phase";
import { formatCardDate } from "@/lib/format";
import { typeBadgeClass, typeLabel } from "@/lib/event-type";
import { parseFilters, toQueryString } from "@/lib/filters";
import { safeHref } from "@/lib/url";

export const dynamic = "force-dynamic";

const getEvent = cache((id: string) =>
  findPublicEvent(
    id,
    (eventId) =>
      prisma.event.findUnique({
        where: { id: eventId },
        include: { source: { select: { name: true } } },
      }) as Promise<DetailEvent | null>,
  ),
);

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildEventMetadata(await getEvent(id));
}

export default async function EventPage({ params, searchParams }: Props) {
  const { id } = await params;
  // Rebuild the list query from parsed filters so only known params survive.
  const rawBack = (await searchParams).back;
  const back: string =
    typeof rawBack === "string"
      ? toQueryString(
          parseFilters(Object.fromEntries(new URLSearchParams(rawBack))),
        )
      : "";
  const event = await getEvent(id);
  if (!event) notFound();
  const href = safeHref(event.url);
  const phase = eventPhase(event.startsAt, event.endsAt);

  return (
    <main className={shell}>
      <Link
        href={`/${back}`}
        className={`inline-flex min-h-11 items-center text-sm underline ${focus}`}
      >
        ← {back ? "Back to filtered events" : "All events"}
      </Link>
      <article className="mt-4">
        <span
          className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${typeBadgeClass(event.type)}`}
        >
          {typeLabel(event.type)}
        </span>
        <h1 className={`mt-2 ${pageTitle}`}>{event.title}</h1>
        {phase !== "upcoming" && (
          <p
            className={`ml-0 mt-2 inline-block rounded px-2 py-0.5 text-sm font-medium ${
              phase === "live"
                ? "bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-200"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {PHASE_LABEL[phase]}
          </p>
        )}
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border border-border bg-card p-4 text-sm">
          <dt className="font-medium">When</dt>
          <dd>
            <time dateTime={event.startsAt.toISOString()}>
              {formatCardDate(event.startsAt)}
            </time>
            {event.endsAt && (
              <>
                {" – "}
                <time dateTime={event.endsAt.toISOString()}>
                  {formatCardDate(event.endsAt)}
                </time>
              </>
            )}
          </dd>
          <dt className="font-medium">Where</dt>
          <dd>{event.isOnline ? "Online" : (event.venue ?? "In person")}</dd>
          <dt className="font-medium">Type</dt>
          <dd>{typeLabel(event.type)}</dd>
          {event.organiser && (
            <>
              <dt className="font-medium">Organiser</dt>
              <dd>{event.organiser}</dd>
            </>
          )}
          <dt className="font-medium">Source</dt>
          <dd>{event.source ? `via ${event.source.name}` : "Submitted"}</dd>
        </dl>
        {event.description && (
          <div className="mt-6 max-w-prose whitespace-pre-line leading-relaxed">
            {event.description}
          </div>
        )}
        {href && (
          <ExternalLink href={href} className={`mt-6 ${btnPrimary}`}>
            Official event page
          </ExternalLink>
        )}
      </article>
    </main>
  );
}

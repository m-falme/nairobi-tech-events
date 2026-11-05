import { focus, shell } from "@/lib/ui";
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
import { formatEventDate } from "@/lib/format";
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

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildEventMetadata(await getEvent(id));
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  const href = safeHref(event.url);
  const phase = eventPhase(event.startsAt, event.endsAt);

  return (
    <main className={shell}>
      <Link href="/" className={`text-sm underline ${focus}`}>
        ← All events
      </Link>
      <article className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
        {phase !== "upcoming" && (
          <p
            className={`mt-2 inline-block rounded px-2 py-0.5 text-sm font-medium ${
              phase === "live"
                ? "bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-200"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {PHASE_LABEL[phase]}
          </p>
        )}
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-medium">When</dt>
          <dd>
            <time dateTime={event.startsAt.toISOString()}>
              {formatEventDate(event.startsAt)}
            </time>
            {event.endsAt && (
              <>
                {" – "}
                <time dateTime={event.endsAt.toISOString()}>
                  {formatEventDate(event.endsAt)}
                </time>
              </>
            )}
          </dd>
          <dt className="font-medium">Where</dt>
          <dd>{event.isOnline ? "Online" : (event.venue ?? "In person")}</dd>
          <dt className="font-medium">Type</dt>
          <dd className="capitalize">{event.type}</dd>
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
          <div className="mt-6 whitespace-pre-line">{event.description}</div>
        )}
        {href && (
          <ExternalLink
            href={href}
            className={`mt-6 inline-block rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 ${focus}`}
          >
            Official event page
          </ExternalLink>
        )}
      </article>
    </main>
  );
}

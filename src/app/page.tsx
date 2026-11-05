import { focus, shell } from "@/lib/ui";
import Link from "next/link";
import { listEvents } from "@/lib/events";
import {
  EVENT_TYPES,
  parseFilters,
  toQueryString,
  totalPages,
  type RawSearchParams,
} from "@/lib/filters";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseFilters(await searchParams);
  const { events, count, page } = await listEvents(filters);
  const pages = totalPages(count);
  const hasFilters = Boolean(
    filters.q ||
    filters.type?.length ||
    filters.format ||
    filters.range ||
    filters.from ||
    filters.to,
  );

  return (
    <main className={shell}>
      <h1 className="text-3xl font-bold tracking-tight">Nairobi Tech Events</h1>
      <p className="mt-2 text-muted-foreground">
        Upcoming hackathons, meetups, workshops and conferences in Nairobi.
      </p>
      <p className="mt-2">
        <Link href="/submit" className={`underline ${focus}`}>
          Submit an event
        </Link>
        {" · "}
        <Link href="/sources" className={`underline ${focus}`}>
          Where listings come from
        </Link>
      </p>

      <form
        method="get"
        role="search"
        aria-label="Filter events"
        className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label htmlFor="q" className="block text-sm font-medium">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q ?? ""}
            maxLength={100}
            className={`mt-1 w-full rounded border px-2 py-1 ${focus}`}
          />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium">Type</legend>
          <div className="mt-1 flex flex-wrap gap-4">
            {EVENT_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-1">
                <input
                  className={focus}
                  type="checkbox"
                  name="type"
                  value={t}
                  defaultChecked={filters.type?.includes(t) ?? false}
                />
                {t[0].toUpperCase() + t.slice(1)}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="format" className="block text-sm font-medium">
            Format
          </label>
          <select
            id="format"
            name="format"
            defaultValue={filters.format ?? ""}
            className={`mt-1 w-full rounded border px-2 py-1 ${focus}`}
          >
            <option value="">Online and in person</option>
            <option value="online">Online</option>
            <option value="in-person">In person</option>
          </select>
        </div>
        <div>
          <label htmlFor="range" className="block text-sm font-medium">
            Date
          </label>
          <select
            id="range"
            name="range"
            defaultValue={filters.range ?? ""}
            className={`mt-1 w-full rounded border px-2 py-1 ${focus}`}
          >
            <option value="">Any upcoming date</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
        </div>
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Custom range (dates in EAT; combines with the Date preset):
        </p>
        <div>
          <label htmlFor="from" className="block text-sm font-medium">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={filters.from ?? ""}
            className={`mt-1 w-full rounded border px-2 py-1 ${focus}`}
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-medium">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={filters.to ?? ""}
            className={`mt-1 w-full rounded border px-2 py-1 ${focus}`}
          />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className={`rounded bg-primary px-4 py-1 text-primary-foreground hover:bg-primary/90 ${focus}`}
          >
            Apply filters
          </button>
          {hasFilters && (
            <Link href="/" className={`self-center underline ${focus}`}>
              Clear filters
            </Link>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {count} upcoming {count === 1 ? "event" : "events"}
      </p>

      {events.length === 0 ? (
        <div className="mt-4 rounded border border-dashed p-6 text-center">
          <h2 className="text-lg font-semibold">No events found</h2>
          <p className="mt-1 text-muted-foreground">
            {hasFilters
              ? "Try removing some filters."
              : "No upcoming events yet. Check back soon."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4" aria-label="Upcoming events">
          {events.map((e) => (
            <li key={e.id} className="rounded border p-4">
              <article>
                <h2 className="text-lg font-semibold">
                  <Link
                    href={`/events/${e.id}`}
                    className={`underline ${focus}`}
                  >
                    {e.title}
                  </Link>
                </h2>
                <p className="text-sm text-muted-foreground">
                  <time dateTime={e.startsAt.toISOString()}>
                    {formatEventDate(e.startsAt)}
                  </time>
                  {" · "}
                  {e.isOnline ? "Online" : (e.venue ?? "In person")}
                  {" · "}
                  <span className="capitalize">{e.type}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {e.source ? `via ${e.source.name}` : "Submitted"}
                  {e.organiser && <> · By {e.organiser}</>}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex justify-between">
          {page > 1 ? (
            <Link
              href={`/${toQueryString(filters, { page: page - 1 })}`}
              rel="prev"
              className={`underline ${focus}`}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span aria-current="page">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link
              href={`/${toQueryString(filters, { page: page + 1 })}`}
              rel="next"
              className={`underline ${focus}`}
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}

import { focus, lead, pageTitle, shell } from "@/lib/ui";
import Link from "next/link";
import { listEvents } from "@/lib/events";
import {
  EVENT_TYPES,
  parseFilters,
  toQueryString,
  totalPages,
  type RawSearchParams,
} from "@/lib/filters";
import { EventCard } from "@/components/event-card";
import { typeLabel } from "@/lib/event-type";

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

  const chips: { label: string; href: string }[] = [];
  const without = (o: Partial<typeof filters>) =>
    `/${toQueryString(filters, { ...o, page: 1 })}`;
  if (filters.q)
    chips.push({ label: `“${filters.q}”`, href: without({ q: undefined }) });
  for (const t of filters.type ?? [])
    chips.push({
      label: typeLabel(t),
      href: without({ type: filters.type?.filter((x) => x !== t) }),
    });
  if (filters.format)
    chips.push({
      label: filters.format === "online" ? "Online" : "In person",
      href: without({ format: undefined }),
    });
  if (filters.range)
    chips.push({
      label: { today: "Today", week: "This week", month: "This month" }[
        filters.range
      ],
      href: without({ range: undefined }),
    });
  if (filters.from)
    chips.push({
      label: `From ${filters.from}`,
      href: without({ from: undefined }),
    });
  if (filters.to)
    chips.push({ label: `To ${filters.to}`, href: without({ to: undefined }) });

  const control = `mt-1 block min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm ${focus}`;
  const labelCls = "block text-sm font-medium";

  return (
    <main className={shell}>
      <h1 className={pageTitle}>Nairobi Tech Events</h1>
      <p className={lead}>
        Upcoming hackathons, meetups, workshops and conferences in Nairobi.
      </p>

      <form
        method="get"
        role="search"
        aria-label="Filter events"
        className="mt-6 rounded-lg border border-border bg-card p-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <label htmlFor="q" className={labelCls}>
              Search
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q ?? ""}
              maxLength={100}
              className={control}
            />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="range" className={labelCls}>
              Date
            </label>
            <select
              id="range"
              name="range"
              defaultValue={filters.range ?? ""}
              className={control}
            >
              <option value="">Any upcoming date</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="format" className={labelCls}>
              Format
            </label>
            <select
              id="format"
              name="format"
              defaultValue={filters.format ?? ""}
              className={control}
            >
              <option value="">Online and in person</option>
              <option value="online">Online</option>
              <option value="in-person">In person</option>
            </select>
          </div>
          <fieldset className="md:col-span-12">
            <legend className="text-sm font-medium">Type</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <label
                  key={t}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-input px-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
                >
                  <input
                    className="size-4 accent-primary focus-visible:outline-none"
                    type="checkbox"
                    name="type"
                    value={t}
                    defaultChecked={filters.type?.includes(t) ?? false}
                  />
                  {typeLabel(t)}
                </label>
              ))}
            </div>
          </fieldset>
          <details
            className="md:col-span-12"
            open={Boolean(filters.from || filters.to)}
          >
            <summary
              className={`inline-flex min-h-11 cursor-pointer items-center text-sm font-medium ${focus}`}
            >
              Custom dates
            </summary>
            <p className="text-sm text-muted-foreground">
              Dates in EAT; combines with the Date preset.
            </p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="from" className={labelCls}>
                  From
                </label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={filters.from ?? ""}
                  className={control}
                />
              </div>
              <div>
                <label htmlFor="to" className={labelCls}>
                  To
                </label>
                <input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={filters.to ?? ""}
                  className={control}
                />
              </div>
            </div>
          </details>
          <div className="flex flex-wrap items-center gap-3 md:col-span-12">
            <button
              type="submit"
              className={`inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 ${focus}`}
            >
              Apply filters
            </button>
            {hasFilters && (
              <Link
                href="/"
                className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm underline ${focus}`}
              >
                Clear filters
              </Link>
            )}
          </div>
        </div>
      </form>

      {chips.length > 0 && (
        <ul aria-label="Active filters" className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <li key={c.href + c.label}>
              <Link
                href={c.href}
                aria-label={
                  c.label.startsWith("“")
                    ? "Remove search filter"
                    : `Remove filter ${c.label}`
                }
                className={`inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-secondary px-3 text-sm text-secondary-foreground hover:bg-secondary/80 ${focus}`}
              >
                {c.label} <span aria-hidden="true">×</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {count} upcoming {count === 1 ? "event" : "events"}
      </p>

      {events.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center">
          <h2 className="text-lg font-semibold">No events found</h2>
          <p className="mt-1 text-muted-foreground">
            {hasFilters
              ? "Try removing some filters."
              : "No upcoming events yet. Check back soon."}
          </p>
          <p className="mt-4">
            <Link
              href="/submit"
              className={`inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 ${focus}`}
            >
              Submit an event
            </Link>
          </p>
        </div>
      ) : (
        <ul
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          aria-label="Upcoming events"
        >
          {events.map((e) => (
            <li key={e.id}>
              <EventCard e={e} />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-6 flex items-center justify-between"
        >
          {page > 1 ? (
            <Link
              href={`/${toQueryString(filters, { page: page - 1 })}`}
              rel="prev"
              className={`inline-flex min-h-11 items-center px-2 underline ${focus}`}
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
              className={`inline-flex min-h-11 items-center px-2 underline ${focus}`}
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

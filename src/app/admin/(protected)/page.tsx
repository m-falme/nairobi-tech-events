import Link from "next/link";
import { prisma } from "@/lib/db";
import { findDuplicates, normaliseUrl } from "@/lib/duplicates";
import { formatEventDate } from "@/lib/format";
import { focus } from "@/lib/ui";
import { approveEvent, rejectEvent } from "./actions";

const DAY = 24 * 3600_000;

export default async function ReviewQueue({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const pending = await prisma.event.findMany({
    where: { status: "pending" },
    orderBy: { startsAt: "asc" },
    take: 100,
    include: { source: { select: { name: true } } },
  });
  // Same-URL candidates: any non-rejected event on the same host, any date.
  // Title candidates: non-rejected events near the pending dates.
  const urls = [...new Set(pending.map((p) => normaliseUrl(p.url)))];
  const others = pending.length
    ? await prisma.event.findMany({
        where: {
          status: { not: "rejected" },
          OR: [
            // Indexed exact match on the normalised URL.
            { normalizedUrl: { in: urls } },
            {
              startsAt: {
                gte: new Date(pending[0].startsAt.getTime() - DAY),
                lte: new Date(
                  pending[pending.length - 1].startsAt.getTime() + DAY,
                ),
              },
            },
          ],
        },
        select: { id: true, title: true, url: true, startsAt: true },
      })
    : [];
  const total = await prisma.event.count({ where: { status: "pending" } });

  return (
    <main className="mt-6">
      <h1 className="text-2xl font-bold">Pending events ({total})</h1>
      {notice === "not-pending" && (
        <p
          role="alert"
          className="mt-3 rounded border border-amber-500 bg-amber-50 p-2"
        >
          That event was no longer pending (already reviewed?). Nothing was
          changed.
        </p>
      )}
      {total > pending.length && (
        <p className="mt-1 text-sm text-gray-700">
          Showing {pending.length} of {total} (soonest first).
        </p>
      )}
      {pending.length === 0 ? (
        <p className="mt-4 rounded border border-dashed p-6 text-center">
          Nothing to review.
        </p>
      ) : (
        <ul className="mt-4 space-y-4" aria-label="Pending events">
          {pending.map((e) => {
            const dups = findDuplicates(e, others);
            return (
              <li key={e.id} className="rounded border p-4">
                <h2 className="text-lg font-semibold">{e.title}</h2>
                <p className="text-sm text-gray-700">
                  <time dateTime={e.startsAt.toISOString()}>
                    {formatEventDate(e.startsAt)}
                  </time>
                  {" · "}
                  {e.isOnline ? "Online" : (e.venue ?? "In person")}
                  {" · "}
                  <span className="capitalize">{e.type}</span>
                  {" · "}
                  {e.source ? `via ${e.source.name}` : "Submitted"}
                </p>
                <p className="text-sm break-all text-gray-700">{e.url}</p>
                {dups.length > 0 && (
                  <div
                    role="status"
                    className="mt-2 rounded border border-amber-500 bg-amber-50 p-2 text-sm"
                  >
                    <p className="font-medium">Possible duplicate of:</p>
                    <ul className="list-disc pl-5">
                      {dups.map((d) => (
                        <li key={d.id}>
                          {d.title} (
                          {d.reason === "same-url"
                            ? "same URL"
                            : "similar title, same day"}
                          )
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  <form action={approveEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      aria-label={`Approve: ${e.title}`}
                      className={`rounded bg-green-700 px-3 py-1 text-white ${focus}`}
                    >
                      Approve
                    </button>
                  </form>
                  <Link
                    href={`/admin/events/${e.id}/edit`}
                    aria-label={`Edit and approve: ${e.title}`}
                    className={`rounded border px-3 py-1 ${focus}`}
                  >
                    Edit and approve
                  </Link>
                  <form action={rejectEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      aria-label={`Reject: ${e.title}`}
                      className={`rounded bg-red-700 px-3 py-1 text-white ${focus}`}
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

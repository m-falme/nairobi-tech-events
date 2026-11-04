import Link from "next/link";
import { prisma } from "@/lib/db";
import { findDuplicates } from "@/lib/duplicates";
import { formatEventDate } from "@/lib/format";
import { focus } from "@/lib/ui";
import { approveEvent, rejectEvent } from "./actions";

const DAY = 24 * 3600_000;

export default async function ReviewQueue() {
  const pending = await prisma.event.findMany({
    where: { status: "pending" },
    orderBy: { startsAt: "asc" },
    take: 100,
    include: { source: { select: { name: true } } },
  });
  const others = pending.length
    ? await prisma.event.findMany({
        where: {
          status: { not: "rejected" },
          OR: [
            { url: { in: pending.map((p) => p.url) } },
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

  return (
    <main className="mt-6">
      <h1 className="text-2xl font-bold">Pending events ({pending.length})</h1>
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
                    role="alert"
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
                      className={`rounded bg-green-700 px-3 py-1 text-white ${focus}`}
                    >
                      Approve<span className="sr-only">: {e.title}</span>
                    </button>
                  </form>
                  <Link
                    href={`/admin/events/${e.id}/edit`}
                    className={`rounded border px-3 py-1 ${focus}`}
                  >
                    Edit and approve<span className="sr-only">: {e.title}</span>
                  </Link>
                  <form action={rejectEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      className={`rounded bg-red-700 px-3 py-1 text-white ${focus}`}
                    >
                      Reject<span className="sr-only">: {e.title}</span>
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

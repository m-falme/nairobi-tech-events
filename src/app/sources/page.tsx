import { ExternalLink } from "@/components/external-link";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PLATFORM_SUMMARY, toPublicSource } from "@/lib/public-sources";
import { SITE_NAME } from "@/lib/site";
import { focus, shell } from "@/lib/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Where listings come from · ${SITE_NAME}`,
  description: "The feeds and submissions behind Nairobi Tech Events.",
};

export default async function SourcesPage() {
  const rows = await prisma.source.findMany({
    orderBy: { name: "asc" },
    // Public page: only the columns needed; never lastError or terms notes.
    select: { id: true, name: true, kind: true, url: true, active: true },
  });
  const sources = rows.map(toPublicSource);

  return (
    <main className={shell}>
      <Link href="/" className={`text-sm underline ${focus}`}>
        ← All events
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        Where listings come from
      </h1>
      <p className="mt-2 text-muted-foreground">
        We never scrape websites. Events come from official feeds we have
        approval to use, and from community submissions that an admin reviews
        before they appear. Every listing links back to its official page.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Feeds</h2>
      {sources.length === 0 ? (
        <p className="mt-2 rounded border border-dashed p-6 text-center">
          No feeds are set up yet.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Event feeds</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-2 pr-4">
                  Name
                </th>
                <th scope="col" className="py-2 pr-4">
                  Method
                </th>
                <th scope="col" className="py-2 pr-4">
                  Status
                </th>
                <th scope="col" className="py-2">
                  Link
                </th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id} className="border-b">
                  <th scope="row" className="py-2 pr-4 font-medium">
                    {s.name}
                  </th>
                  <td className="py-2 pr-4">{s.method}</td>
                  <td className="py-2 pr-4">{s.status}</td>
                  <td className="py-2">
                    {s.link ? (
                      <ExternalLink
                        href={s.link}
                        className={`underline ${focus}`}
                      >
                        Visit<span className="sr-only"> {s.name}</span>
                      </ExternalLink>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-xl font-semibold">Platforms</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {PLATFORM_SUMMARY.map((p) => (
          <li key={p.platform}>
            <ExternalLink href={p.link} className={`underline ${focus}`}>
              {p.platform}
            </ExternalLink>
            : {p.method}
          </li>
        ))}
        <li>
          <Link href="/submit" className={`underline ${focus}`}>
            Community submissions
          </Link>
          : reviewed by an admin before they are listed
        </li>
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">
        The full policy, including terms checks for each platform, is in
        SOURCES.md in the project repository.
      </p>
    </main>
  );
}

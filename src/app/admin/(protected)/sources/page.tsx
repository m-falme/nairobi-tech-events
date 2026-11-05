import { prisma } from "@/lib/db";
import { isImportAllowed } from "@/lib/importer/allowlist";
import { SourceForm } from "./source-form";

export const metadata = { title: "Sources · Admin" };

const fmt = (d: Date | null) =>
  d
    ? d.toLocaleString("en-KE", {
        timeZone: "Africa/Nairobi",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " EAT"
    : "never";

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="mt-6">
      <h1 className="text-2xl font-bold tracking-tight">Sources</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The importer only fetches active iCal sources on the approved Luma
        allowlist (see SOURCES.md), at most every 6 hours.
      </p>
      <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
        {sources.map((s) => (
          <li key={s.id} className="p-3 text-sm">
            <p className="font-medium">
              {s.name}{" "}
              <span className="text-muted-foreground">
                ({s.kind}
                {s.trusted ? ", trusted" : ""}
                {s.active ? "" : ", inactive"})
              </span>
            </p>
            {s.url && (
              <p className="break-all text-muted-foreground">{s.url}</p>
            )}
            <p>
              {isImportAllowed(s)
                ? "Importable"
                : "Not imported (not allowlisted)"}
              {" · "}Last fetched: {fmt(s.lastFetchedAt)}
            </p>
            {s.lastError && (
              <p className="mt-1 rounded-md border border-red-600 bg-red-50 p-2 text-red-950 dark:bg-red-950/40 dark:text-red-100">
                Last error: {s.lastError}
              </p>
            )}
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Add a source</h2>
      <SourceForm />
    </main>
  );
}

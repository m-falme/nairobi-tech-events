import { shell } from "@/lib/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { buildEventMetadata } from "@/lib/event-detail";

export const metadata: Metadata = {
  ...buildEventMetadata(null),
  robots: { index: false },
};

export default function EventNotFound() {
  return (
    <main className={shell}>
      <h1 className="text-2xl font-bold tracking-tight">Event not found</h1>
      <p className="mt-2 text-muted-foreground">
        This event doesn&apos;t exist or isn&apos;t published.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Back to all events
      </Link>
    </main>
  );
}

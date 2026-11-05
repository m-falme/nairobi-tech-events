import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { focus, shell } from "@/lib/ui";

export const metadata: Metadata = {
  title: `Page not found · ${SITE_NAME}`,
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className={shell}>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        There&apos;s nothing at this address.
      </p>
      <Link href="/" className={`mt-4 inline-block underline ${focus}`}>
        Back to all events
      </Link>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { focus, shell } from "@/lib/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={shell}>
      <title>Something went wrong · Nairobi Tech Events</title>
      <div role="alert">
        <h1 className="text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t load this page. Please try again in a moment.
        </p>
        {error.digest && (
          <p className="mt-2 text-sm text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <div className="mt-4 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className={`rounded bg-primary px-4 py-1 text-primary-foreground ${focus}`}
        >
          Try again
        </button>
        <Link href="/" className={`self-center underline ${focus}`}>
          Back to all events
        </Link>
      </div>
    </main>
  );
}

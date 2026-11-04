"use client";

import Link from "next/link";
import { useEffect } from "react";
import { focus } from "@/lib/ui";

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
    <main className="mx-auto max-w-3xl p-8">
      <title>Something went wrong · Nairobi Tech Events</title>
      <div role="alert">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-gray-700">
          We couldn&apos;t load this page. Please try again in a moment.
        </p>
        {error.digest && (
          <p className="mt-2 text-sm text-gray-600">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <div className="mt-4 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className={`rounded bg-blue-700 px-4 py-1 text-white ${focus}`}
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

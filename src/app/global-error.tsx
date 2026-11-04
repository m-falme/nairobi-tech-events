"use client";

// Replaces the root layout when it fails, so it renders its own <html>.
// Plain styles only: globals.css may not have loaded.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <title>Something went wrong · Nairobi Tech Events</title>
        <main role="alert">
          <h1>Something went wrong</h1>
          <p>Nairobi Tech Events couldn&apos;t load. Please try again.</p>
          {error.digest && <p>Reference: {error.digest}</p>}
          <button type="button" onClick={reset}>
            Try again
          </button>{" "}
          {/* Full reload on purpose: the root layout failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">Back to all events</a>
        </main>
      </body>
    </html>
  );
}

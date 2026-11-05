import Link from "next/link";
import { focus, lead, pageTitle, shell } from "@/lib/ui";
import { SubmitForm } from "./submit-form";

export const metadata = { title: "Submit an event · Nairobi Tech Events" };

export default function SubmitPage() {
  return (
    <main className={shell}>
      <Link
        href="/"
        className={`inline-flex min-h-11 items-center text-sm underline ${focus}`}
      >
        ← All events
      </Link>
      <h1 className={`mt-2 ${pageTitle}`}>Submit an event</h1>
      <p className={lead}>
        Submissions are reviewed before they appear. Times are in Nairobi time
        (EAT).
      </p>
      <div className="mt-6 max-w-xl rounded-lg border border-border bg-card p-4 sm:p-6">
        <SubmitForm />
      </div>
    </main>
  );
}

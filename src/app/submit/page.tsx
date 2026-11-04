import Link from "next/link";
import { focus } from "@/lib/ui";
import { SubmitForm } from "./submit-form";

export const metadata = { title: "Submit an event · Nairobi Tech Events" };

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/" className={`text-sm underline ${focus}`}>
        ← All events
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Submit an event</h1>
      <p className="mt-2 text-gray-700">
        Submissions are reviewed before they appear. Times are in Nairobi time
        (EAT).
      </p>
      <SubmitForm />
    </main>
  );
}

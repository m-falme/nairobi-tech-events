import Link from "next/link";
import { focus, shell } from "@/lib/ui";
import { SubmitForm } from "./submit-form";

export const metadata = { title: "Submit an event · Nairobi Tech Events" };

export default function SubmitPage() {
  return (
    <main className={shell}>
      <Link href="/" className={`text-sm underline ${focus}`}>
        ← All events
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        Submit an event
      </h1>
      <p className="mt-2 text-muted-foreground">
        Submissions are reviewed before they appear. Times are in Nairobi time
        (EAT).
      </p>
      <SubmitForm />
    </main>
  );
}

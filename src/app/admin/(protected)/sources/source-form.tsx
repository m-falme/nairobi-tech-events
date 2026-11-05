"use client";

import { useActionState } from "react";
import { SOURCE_KINDS, type SourceFormState } from "@/lib/sources-admin";
import { focus } from "@/lib/ui";
import { addSource } from "./actions";

const input = `mt-1 w-full rounded border px-2 py-1 ${focus}`;

export function SourceForm() {
  const [state, action, pending] = useActionState<SourceFormState, FormData>(
    addSource,
    {},
  );
  const err = state.errors ?? {};
  const v = state.values ?? {};
  const aria = (n: string) =>
    err[n]?.length
      ? { "aria-invalid": true, "aria-describedby": `src-${n}-error` }
      : {};
  const Err = ({ n }: { n: string }) =>
    err[n]?.length ? (
      <p id={`src-${n}-error`} className="text-sm text-destructive">
        {err[n].join(", ")}
      </p>
    ) : null;
  return (
    <form action={action} className="mt-4 grid gap-3" noValidate>
      {state.ok && (
        <p role="status" className="text-green-800 dark:text-green-200">
          Source added.
        </p>
      )}
      <div>
        <label htmlFor="src-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="src-name"
          name="name"
          required
          defaultValue={v.name}
          className={input}
          {...aria("name")}
        />
        <Err n="name" />
      </div>
      <div>
        <label htmlFor="src-kind" className="block text-sm font-medium">
          Type
        </label>
        <select
          id="src-kind"
          name="kind"
          defaultValue={v.kind ?? "ical"}
          className={input}
          {...aria("kind")}
        >
          {SOURCE_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <Err n="kind" />
      </div>
      <div>
        <label htmlFor="src-url" className="block text-sm font-medium">
          Feed URL
        </label>
        <input
          id="src-url"
          name="url"
          type="url"
          required
          defaultValue={v.url}
          className={input}
          {...aria("url")}
        />
        <Err n="url" />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="src-trusted"
          name="trusted"
          type="checkbox"
          className={focus}
        />
        <label htmlFor="src-trusted" className="text-sm">
          Trusted (imported events are auto-approved)
        </label>
      </div>
      <div>
        <button
          type="submit"
          disabled={pending}
          className={`rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60 ${focus}`}
        >
          {pending ? "Adding…" : "Add source"}
        </button>
      </div>
    </form>
  );
}

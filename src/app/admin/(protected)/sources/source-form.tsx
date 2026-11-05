"use client";

import { useActionState } from "react";
import { SOURCE_KINDS, type SourceFormState } from "@/lib/sources-admin";
import { btnPrimary, focus, input, label } from "@/lib/ui";
import { addSource } from "./actions";

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
        <label htmlFor="src-name" className={label}>
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
        <label htmlFor="src-kind" className={label}>
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
        <label htmlFor="src-url" className={label}>
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
          className={`size-5 accent-primary ${focus}`}
        />
        <label htmlFor="src-trusted" className="text-sm">
          Trusted (imported events are auto-approved)
        </label>
      </div>
      <div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Adding…" : "Add source"}
        </button>
      </div>
    </form>
  );
}

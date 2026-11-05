"use client";

import { useActionState } from "react";
import { EVENT_TYPES } from "@/lib/filters";
import { HONEYPOT_FIELD, type SubmitState } from "@/lib/submission-form";
import { focus } from "@/lib/ui";
import { submitEvent } from "./actions";

const input = `mt-1 w-full rounded border px-2 py-1 ${focus}`;

export function SubmitForm() {
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    submitEvent,
    {},
  );

  if (state.status === "pending-review")
    return (
      <div
        role="status"
        className="mt-6 rounded border border-green-600 bg-green-50 p-4"
      >
        <h2 className="text-lg font-semibold">
          Thanks! Your event is pending review.
        </h2>
        <p className="mt-1">
          It will appear on the board once an admin approves it.
        </p>
      </div>
    );

  const err = state.errors ?? {};
  const v = state.values ?? {};
  const a11y = (n: string) =>
    err[n]?.length
      ? { "aria-invalid": true, "aria-describedby": `${n}-error` }
      : {};
  const Err = ({ n }: { n: string }) =>
    err[n]?.length ? (
      <p id={`${n}-error`} className="text-sm text-red-700">
        {err[n].join(", ")}
      </p>
    ) : null;

  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      {state.status === "rate-limited" && (
        <p role="alert" className="rounded border border-red-600 bg-red-50 p-2">
          Too many submissions from your network. Please try again in an hour.
        </p>
      )}
      {Object.keys(err).length > 0 && (
        <p role="alert" className="text-red-700">
          Please fix the highlighted fields.
        </p>
      )}
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title (required)
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={v.title}
          className={input}
          {...a11y("title")}
        />
        <Err n="title" />
      </div>
      <div>
        <label htmlFor="startsAt" className="block text-sm font-medium">
          Starts, EAT (required)
        </label>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={v.startsAt}
          className={input}
          {...a11y("startsAt")}
        />
        <Err n="startsAt" />
      </div>
      <div>
        <label htmlFor="endsAt" className="block text-sm font-medium">
          Ends, EAT (optional)
        </label>
        <input
          id="endsAt"
          name="endsAt"
          type="datetime-local"
          defaultValue={v.endsAt}
          className={input}
          {...a11y("endsAt")}
        />
        <Err n="endsAt" />
      </div>
      <div>
        <label htmlFor="url" className="block text-sm font-medium">
          Official event URL (required)
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://"
          defaultValue={v.url}
          className={input}
          {...a11y("url")}
        />
        <Err n="url" />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium">
          Type (required)
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue={v.type ?? ""}
          className={input}
          {...a11y("type")}
        >
          <option value="" disabled>
            Choose a type
          </option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <Err n="type" />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isOnline"
          name="isOnline"
          type="checkbox"
          defaultChecked={v.isOnline === "on"}
          className={focus}
          aria-describedby="isOnline-hint"
        />
        <label htmlFor="isOnline" className="text-sm font-medium">
          Online event
        </label>
        <span id="isOnline-hint" className="text-sm text-gray-700">
          (venue is optional)
        </span>
      </div>
      <div>
        <label htmlFor="venue" className="block text-sm font-medium">
          Venue (optional)
        </label>
        <input
          id="venue"
          name="venue"
          maxLength={200}
          defaultValue={v.venue}
          className={input}
          {...a11y("venue")}
        />
        <Err n="venue" />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={5000}
          defaultValue={v.description}
          className={input}
          {...a11y("description")}
        />
        <Err n="description" />
      </div>
      {/* Honeypot: hidden from sighted users and screen readers, not focusable. */}
      <div
        aria-hidden="true"
        className="absolute -left-[10000px] h-px w-px overflow-hidden"
      >
        <label htmlFor={HONEYPOT_FIELD}>Leave this empty</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={pending}
          className={`rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-60 ${focus}`}
        >
          {pending ? "Submitting…" : "Submit for review"}
        </button>
      </div>
    </form>
  );
}

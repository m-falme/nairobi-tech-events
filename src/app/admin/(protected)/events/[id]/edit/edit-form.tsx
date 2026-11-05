"use client";

import { useActionState } from "react";
import { EVENT_TYPES } from "@/lib/filters";
import {
  alertError,
  btnApprove,
  focus,
  input,
  label as labelCls,
} from "@/lib/ui";
import { editAndApprove, type EditState } from "../../../actions";

type Values = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  organiser: string;
  isOnline: boolean;
  type: string;
  url: string;
};

function Field({
  name,
  label,
  errors,
  children,
}: {
  name: string;
  label: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      {children}
      {errors?.length ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {errors.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

export function EditForm({ event }: { event: Values }) {
  const [state, action, pending] = useActionState<EditState, FormData>(
    editAndApprove,
    {},
  );
  const err = state.errors ?? {};
  const aria = (n: string) =>
    err[n]?.length
      ? { "aria-invalid": true, "aria-describedby": `${n}-error` }
      : {};
  return (
    <form action={action} className="mt-4 grid gap-3">
      {state.error && (
        <p role="alert" className={alertError}>
          {state.error}
        </p>
      )}
      <input type="hidden" name="id" value={event.id} />
      <Field name="title" label="Title" errors={err.title}>
        <input
          id="title"
          name="title"
          required
          defaultValue={event.title}
          className={input}
          {...aria("title")}
        />
      </Field>
      <Field name="startsAt" label="Starts (EAT)" errors={err.startsAt}>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={event.startsAt}
          className={input}
          {...aria("startsAt")}
        />
      </Field>
      <Field name="endsAt" label="Ends (EAT, optional)" errors={err.endsAt}>
        <input
          id="endsAt"
          name="endsAt"
          type="datetime-local"
          defaultValue={event.endsAt}
          className={input}
          {...aria("endsAt")}
        />
      </Field>
      <Field name="type" label="Type" errors={err.type}>
        <select
          id="type"
          name="type"
          defaultValue={event.type}
          className={input}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </Field>
      <Field name="url" label="Official URL" errors={err.url}>
        <input
          id="url"
          name="url"
          type="url"
          required
          defaultValue={event.url}
          className={input}
          {...aria("url")}
        />
      </Field>
      <Field name="venue" label="Venue" errors={err.venue}>
        <input
          id="venue"
          name="venue"
          defaultValue={event.venue}
          className={input}
        />
      </Field>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isOnline"
          defaultChecked={event.isOnline}
          className={`size-5 accent-primary ${focus}`}
        />
        Online event
      </label>
      <Field name="organiser" label="Organiser" errors={err.organiser}>
        <input
          id="organiser"
          name="organiser"
          defaultValue={event.organiser}
          className={input}
        />
      </Field>
      <Field name="description" label="Description" errors={err.description}>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={event.description}
          className={input}
        />
      </Field>
      <div>
        <button type="submit" disabled={pending} className={btnApprove}>
          {pending ? "Saving…" : "Save and approve"}
        </button>
      </div>
    </form>
  );
}

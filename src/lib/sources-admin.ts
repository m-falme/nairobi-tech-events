import { z } from "zod";
import { assertAdmin, type MaybeSession } from "./authz";
import { formToObject, httpUrl } from "./review";

export const SOURCE_KINDS = ["ical", "rss", "api"] as const;

export const sourceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  kind: z.enum(SOURCE_KINDS, { message: "Choose ical, rss or api" }),
  url: httpUrl,
  trusted: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export type SourceFormState = {
  ok?: boolean;
  errors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export type SourcesDeps = {
  getSession: () => Promise<MaybeSession | undefined>;
  db: {
    source: {
      create(args: {
        data: {
          name: string;
          kind: (typeof SOURCE_KINDS)[number];
          url: string;
          trusted: boolean;
          active: boolean;
          termsNote: string;
        };
      }): Promise<unknown>;
    };
  };
};

/**
 * Admin adds a source. Adding does not make it importable: the importer only
 * fetches allowlisted Luma calendars (src/lib/importer/allowlist.ts).
 */
export async function addSourceCore(
  deps: SourcesDeps,
  fd: FormData,
): Promise<SourceFormState> {
  assertAdmin(await deps.getSession());
  const raw = formToObject(fd);
  const parsed = sourceSchema.safeParse(raw);
  if (!parsed.success)
    return {
      errors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
      values: raw,
    };
  await deps.db.source.create({
    data: {
      ...parsed.data,
      active: true,
      termsNote: "Added by admin. Imported only if approved in SOURCES.md.",
    },
  });
  return { ok: true };
}

// Client-safe constants/types shared by the submit form and server code.
export const HONEYPOT_FIELD = "website";

export type SubmitState = {
  status?: "pending-review" | "rate-limited";
  errors?: Record<string, string[]>;
  values?: Record<string, string>;
};

import { approvedLumaCalendar } from "./allowlist";

export const DEFAULT_USER_AGENT =
  "NairobiTechEventsBot/1.0 (+https://github.com/m-falme/nairobi-tech-events)";
export const MAX_BYTES = 5 * 1024 * 1024;
export const MAX_REDIRECTS = 3;
export const MAX_DELAY_MS = 60_000;

export type FetchOptions = {
  userAgent?: string;
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
  maxBytes?: number;
  /** Every URL (initial and each redirect hop) must pass. Default: Luma allowlist. */
  allow?: (url: string) => boolean;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

export class FetchError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}

const defaultSleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));
const defaultAllow = (url: string) => approvedLumaCalendar(url) !== null;

/** Retry-After as delta-seconds or HTTP-date; ms from now, capped at 60s. */
export function parseRetryAfter(
  value: string | null,
  now: number = Date.now(),
): number | undefined {
  if (!value) return undefined;
  const v = value.trim();
  let ms: number;
  if (/^\d+$/.test(v)) ms = Number(v) * 1000;
  else {
    const t = Date.parse(v);
    if (Number.isNaN(t)) return undefined;
    ms = t - now;
  }
  return Math.min(Math.max(ms, 0), MAX_DELAY_MS);
}

/** Read the body as a stream, aborting once more than maxBytes arrive. */
async function readLimited(res: Response, maxBytes: number): Promise<string> {
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > maxBytes) {
    await res.body?.cancel().catch(() => {});
    throw new FetchError("Feed too large", false);
  }
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new FetchError("Feed too large", false);
    }
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}

const isRedirect = (s: number) => [301, 302, 303, 307, 308].includes(s);

/** One attempt: follow up to MAX_REDIRECTS manually, checking every hop. */
async function attemptOnce(url: string, o: Required<FetchOptions>) {
  let current = url;
  for (let hop = 0; ; hop++) {
    if (!o.allow(current))
      throw new FetchError(`URL not allowed: ${current}`, false);
    let res: Response;
    try {
      res = await o.fetchImpl(current, {
        headers: {
          "User-Agent": o.userAgent,
          Accept: "text/calendar, */*;q=0.5",
        },
        signal: AbortSignal.timeout(o.timeoutMs),
        redirect: "manual",
      });
    } catch (e) {
      throw new FetchError(
        `Network error: ${e instanceof Error ? e.message : String(e)}`,
        true,
      );
    }
    if (isRedirect(res.status)) {
      await res.body?.cancel().catch(() => {});
      const loc = res.headers.get("location");
      if (!loc) throw new FetchError("Redirect without Location", false);
      if (hop >= MAX_REDIRECTS)
        throw new FetchError("Too many redirects", false);
      try {
        current = new URL(loc, current).href;
      } catch {
        throw new FetchError("Invalid redirect Location", false);
      }
      continue;
    }
    if (res.ok) return readLimited(res, o.maxBytes);
    await res.body?.cancel().catch(() => {});
    const retryable = res.status === 429 || res.status >= 500;
    throw new FetchError(
      `HTTP ${res.status}`,
      retryable,
      res.status,
      parseRetryAfter(res.headers.get("retry-after"), o.now()),
    );
  }
}

/**
 * GET an allowlisted feed as text: our User-Agent, timeout, manual redirects
 * (each hop re-checked, max 3), streamed 5 MB byte cap, and exponential
 * backoff only on network errors, 429 and 5xx (Retry-After honoured, ≤60s).
 */
export async function fetchText(
  url: string,
  opts: FetchOptions = {},
): Promise<string> {
  const o: Required<FetchOptions> = {
    userAgent: DEFAULT_USER_AGENT,
    timeoutMs: 15_000,
    retries: 3,
    baseDelayMs: 2_000,
    maxBytes: MAX_BYTES,
    allow: defaultAllow,
    fetchImpl: fetch,
    sleep: defaultSleep,
    now: Date.now,
    ...opts,
  };
  for (let attempt = 0; ; attempt++) {
    try {
      return await attemptOnce(url, o);
    } catch (e) {
      const err =
        e instanceof FetchError ? e : new FetchError(String(e), false);
      if (!err.retryable || attempt >= o.retries) throw err;
      const backoff = o.baseDelayMs * 2 ** attempt;
      await o.sleep(
        Math.min(Math.max(backoff, err.retryAfterMs ?? 0), MAX_DELAY_MS),
      );
    }
  }
}

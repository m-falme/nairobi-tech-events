export const DEFAULT_USER_AGENT =
  "NairobiTechEventsBot/1.0 (+mailto:mburumark096@gmail.com)";
export const MAX_BYTES = 5 * 1024 * 1024;

export type FetchOptions = {
  userAgent?: string;
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

export class FetchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

const defaultSleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET a feed as text with a timeout, our User-Agent, and exponential backoff
 * on network errors and 4xx/5xx/429 (Retry-After honoured, capped at 60s).
 */
export async function fetchText(
  url: string,
  opts: FetchOptions = {},
): Promise<string> {
  const {
    userAgent = DEFAULT_USER_AGENT,
    timeoutMs = 15_000,
    retries = 3,
    baseDelayMs = 2_000,
    fetchImpl = fetch,
    sleep = defaultSleep,
  } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let delay = baseDelayMs * 2 ** attempt;
    try {
      const res = await fetchImpl(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/calendar, */*;q=0.5",
        },
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "follow",
      });
      if (res.ok) {
        const len = Number(res.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES) throw new FetchError("Feed too large");
        const body = await res.text();
        if (body.length > MAX_BYTES) throw new FetchError("Feed too large");
        return body;
      }
      lastErr = new FetchError(`HTTP ${res.status}`, res.status);
      const ra = Number(res.headers.get("retry-after"));
      if (res.status === 429 && Number.isFinite(ra) && ra > 0)
        delay = Math.max(delay, ra * 1000);
    } catch (e) {
      if (e instanceof FetchError && e.message === "Feed too large") throw e;
      lastErr = e;
    }
    if (attempt < retries) await sleep(Math.min(delay, 60_000));
  }
  throw lastErr instanceof Error ? lastErr : new FetchError(String(lastErr));
}

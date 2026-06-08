/** Shared fetch helpers: timeout, retry with backoff on 429/5xx, JSON + text. */
import { USER_AGENT } from "./constants.js";

export class HttpError extends Error {
  constructor(public status: number, public url: string, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

interface FetchOpts {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  retries?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function rawFetch(url: string, opts: FetchOpts): Promise<Response> {
  const { method = "GET", headers = {}, body, timeoutMs = 20000, retries = 2 } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if ([429, 500, 502, 503, 504].includes(res.status) && attempt < retries) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 1000;
        await sleep(delay);
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) {
        await sleep(2 ** attempt * 1000);
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function getJson<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  const res = await rawFetch(url, opts);
  if (!res.ok) throw new HttpError(res.status, url, `GET ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function postJson<T>(url: string, body: unknown, opts: FetchOpts = {}): Promise<T> {
  const res = await rawFetch(url, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new HttpError(res.status, url, `POST ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function getText(url: string, opts: FetchOpts = {}): Promise<string> {
  const res = await rawFetch(url, { ...opts, headers: { Accept: "*/*", ...(opts.headers ?? {}) } });
  if (!res.ok) throw new HttpError(res.status, url, `GET ${url} failed: ${res.status}`);
  return await res.text();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Run async tasks with a concurrency cap, collecting only fulfilled results. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results.push(await fn(items[idx]));
      } catch {
        /* swallow per-item failures; sourcing is best-effort */
      }
    }
  });
  await Promise.all(workers);
  return results;
}

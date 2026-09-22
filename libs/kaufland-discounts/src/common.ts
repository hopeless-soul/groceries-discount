import { UnsupportedCountryError, UpstreamError } from "./errors.js";

export const COUNTRY_DOMAINS: Readonly<Record<string, string>> = {
  SK: "predajne.kaufland.sk",
};

export const COUNTRY_CURRENCY: Readonly<Record<string, string>> = {
  SK: "EUR",
};

export const STORE_CODE_RE = /^[A-Z]{2}[0-9]{4}$/;

const USER_AGENT = "Mozilla/5.0 (compatible; kaufland-discounts-ai/0.1)";

export function getDomain(countryCode: string): string {
  const domain = COUNTRY_DOMAINS[countryCode];
  if (!domain) {
    const supported = Object.keys(COUNTRY_DOMAINS).sort().join(", ");
    throw new UnsupportedCountryError(
      `Unsupported country code '${countryCode}'; supported: ${supported}`,
    );
  }
  return domain;
}

export interface HttpGetOptions {
  cookies?: Record<string, string>;
  /** Overrides the global `fetch` -- useful for tests or routing through a custom client. */
  fetchImpl?: typeof fetch;
  /** milliseconds; default 15000, matching the Python client's `timeout=15`. */
  timeoutMs?: number;
}

export async function httpGet(url: string, options: HttpGetOptions = {}): Promise<string> {
  const { cookies, fetchImpl = fetch, timeoutMs = 15_000 } = options;
  const headers: Record<string, string> = { "User-Agent": USER_AGENT };
  if (cookies) {
    headers["Cookie"] = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetchImpl(url, { headers, signal: controller.signal });
  } catch (err) {
    throw new UpstreamError(`GET ${url} failed: ${(err as Error).message}`, { cause: err });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new UpstreamError(`GET ${url} failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export function slugify(text: string | null | undefined): string {
  const decomposed = (text ?? "").normalize("NFKD");
  const withoutMarks = decomposed.replace(/[̀-ͯ]/g, "");
  const slug = withoutMarks
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || "unknown";
}

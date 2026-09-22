import { UnsupportedCountryError, UpstreamError } from "./errors.js";
export const COUNTRY_DOMAINS = {
    SK: "predajne.kaufland.sk",
};
export const COUNTRY_CURRENCY = {
    SK: "EUR",
};
export const STORE_CODE_RE = /^[A-Z]{2}[0-9]{4}$/;
const USER_AGENT = "Mozilla/5.0 (compatible; kaufland-discounts-ai/0.1)";
export function getDomain(countryCode) {
    const domain = COUNTRY_DOMAINS[countryCode];
    if (!domain) {
        const supported = Object.keys(COUNTRY_DOMAINS).sort().join(", ");
        throw new UnsupportedCountryError(`Unsupported country code '${countryCode}'; supported: ${supported}`);
    }
    return domain;
}
export async function httpGet(url, options = {}) {
    const { cookies, fetchImpl = fetch, timeoutMs = 15_000 } = options;
    const headers = { "User-Agent": USER_AGENT };
    if (cookies) {
        headers["Cookie"] = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; ");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
        response = await fetchImpl(url, { headers, signal: controller.signal });
    }
    catch (err) {
        throw new UpstreamError(`GET ${url} failed: ${err.message}`, { cause: err });
    }
    finally {
        clearTimeout(timeout);
    }
    if (!response.ok) {
        throw new UpstreamError(`GET ${url} failed: ${response.status} ${response.statusText}`);
    }
    return response.text();
}
export function slugify(text) {
    const decomposed = (text ?? "").normalize("NFKD");
    const withoutMarks = decomposed.replace(/[̀-ͯ]/g, "");
    const slug = withoutMarks
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
    return slug || "unknown";
}
//# sourceMappingURL=common.js.map
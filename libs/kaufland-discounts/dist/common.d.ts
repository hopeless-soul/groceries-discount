export declare const COUNTRY_DOMAINS: Readonly<Record<string, string>>;
export declare const COUNTRY_CURRENCY: Readonly<Record<string, string>>;
export declare const STORE_CODE_RE: RegExp;
export declare function getDomain(countryCode: string): string;
export interface HttpGetOptions {
    cookies?: Record<string, string>;
    /** Overrides the global `fetch` -- useful for tests or routing through a custom client. */
    fetchImpl?: typeof fetch;
    /** milliseconds; default 15000, matching the Python client's `timeout=15`. */
    timeoutMs?: number;
}
export declare function httpGet(url: string, options?: HttpGetOptions): Promise<string>;
export declare function slugify(text: string | null | undefined): string;

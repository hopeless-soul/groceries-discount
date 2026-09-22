import type { DiscountsResponse } from "./types.js";
import type { HttpGetOptions } from "./common.js";
export * from "./types.js";
export * from "./errors.js";
export { findStores, fetchStoreList } from "./findStore.js";
export type { FindStoresOptions } from "./findStore.js";
export { fetchDiscounts, buildDiscountsResponse, extractOfferTemplate } from "./getDiscounts.js";
export { getDomain, httpGet, slugify, COUNTRY_DOMAINS, COUNTRY_CURRENCY, STORE_CODE_RE } from "./common.js";
export type { HttpGetOptions } from "./common.js";
export interface LookupDiscountsOptions extends HttpGetOptions {
    /** ISO 3166-1 alpha-2 country code. Default: "SK". */
    country?: string;
    /** Which matched store to use when `findStores` returns more than one. 0-based. */
    storeIndex?: number;
}
/**
 * End-to-end lookup: city name in, discounts out. Equivalent to `main.py`:
 * resolves the city to a store via {@link findStores}, then fetches that
 * store's discounts via {@link fetchDiscounts} and attaches the full `Store`
 * object under `.store`.
 *
 * Throws {@link NoStoreFoundError} for no match, {@link AmbiguousStoreError}
 * (carrying `.stores`) when multiple stores match and no `storeIndex` was
 * given, or {@link ValidationError} for an out-of-range `storeIndex`.
 */
export declare function lookupDiscounts(city: string, options?: LookupDiscountsOptions): Promise<DiscountsResponse>;

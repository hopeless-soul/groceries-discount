import { type HttpGetOptions } from "./common.js";
import type { Store } from "./types.js";
export declare function fetchStoreList(countryCode: string, httpOptions?: HttpGetOptions): Promise<Store[]>;
export interface FindStoresOptions extends HttpGetOptions {
    /** Require an exact (post-normalization) match instead of a substring match. Default: false. */
    exact?: boolean;
}
/**
 * Resolve a country + free-text city into matching {@link Store} records.
 * Matching is diacritic- and case-insensitive against both `city` and `name`.
 * Results are sorted with exact-city matches first, then alphabetically by city.
 */
export declare function findStores(countryCode: string, city: string, options?: FindStoresOptions): Promise<Store[]>;

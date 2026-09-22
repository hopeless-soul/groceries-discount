import { fetchDiscounts } from "./getDiscounts.js";
import { findStores } from "./findStore.js";
import { AmbiguousStoreError, NoStoreFoundError, ValidationError } from "./errors.js";
export * from "./types.js";
export * from "./errors.js";
export { findStores, fetchStoreList } from "./findStore.js";
export { fetchDiscounts, buildDiscountsResponse, extractOfferTemplate } from "./getDiscounts.js";
export { getDomain, httpGet, slugify, COUNTRY_DOMAINS, COUNTRY_CURRENCY, STORE_CODE_RE } from "./common.js";
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
export async function lookupDiscounts(city, options = {}) {
    const { country = "SK", storeIndex, ...httpOptions } = options;
    const countryCode = country.toUpperCase();
    const stores = await findStores(countryCode, city, httpOptions);
    if (stores.length === 0) {
        throw new NoStoreFoundError(`No stores found for city='${city}' country='${countryCode}'`);
    }
    if (stores.length > 1 && storeIndex === undefined) {
        throw new AmbiguousStoreError(`${stores.length} stores match city='${city}'; pass storeIndex to pick one.`, stores);
    }
    const index = storeIndex ?? 0;
    if (index < 0 || index >= stores.length) {
        throw new ValidationError(`storeIndex ${index} out of range (0..${stores.length - 1})`);
    }
    const store = stores[index];
    const result = await fetchDiscounts(store.store_code, httpOptions);
    result.store = store;
    return result;
}
//# sourceMappingURL=index.js.map
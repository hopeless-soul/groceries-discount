/** Base class for every error this package throws. */
export class KauflandError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = new.target.name;
    }
}
/** `country` isn't in {@link COUNTRY_DOMAINS} (only `SK` is implemented today). */
export class UnsupportedCountryError extends KauflandError {
}
/** A request to Kaufland failed, timed out, or returned an unparseable/unexpected body. */
export class UpstreamError extends KauflandError {
}
/** An argument failed local validation before any request was made. */
export class ValidationError extends KauflandError {
}
/** `findStores`/`lookupDiscounts` found no store for the given city/country. */
export class NoStoreFoundError extends KauflandError {
}
/** `lookupDiscounts` matched more than one store and no `storeIndex` was given. */
export class AmbiguousStoreError extends KauflandError {
    stores;
    constructor(message, stores) {
        super(message);
        this.stores = stores;
    }
}
//# sourceMappingURL=errors.js.map
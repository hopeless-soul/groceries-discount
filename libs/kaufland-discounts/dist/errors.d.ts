import type { Store } from "./types.js";
/** Base class for every error this package throws. */
export declare abstract class KauflandError extends Error {
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
/** `country` isn't in {@link COUNTRY_DOMAINS} (only `SK` is implemented today). */
export declare class UnsupportedCountryError extends KauflandError {
}
/** A request to Kaufland failed, timed out, or returned an unparseable/unexpected body. */
export declare class UpstreamError extends KauflandError {
}
/** An argument failed local validation before any request was made. */
export declare class ValidationError extends KauflandError {
}
/** `findStores`/`lookupDiscounts` found no store for the given city/country. */
export declare class NoStoreFoundError extends KauflandError {
}
/** `lookupDiscounts` matched more than one store and no `storeIndex` was given. */
export declare class AmbiguousStoreError extends KauflandError {
    readonly stores: Store[];
    constructor(message: string, stores: Store[]);
}

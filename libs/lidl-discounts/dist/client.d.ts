import { type LidlSettings } from "./config.js";
import { type OffersResponseData, type StoreData } from "./types.js";
export interface LidlPlusOptions extends LidlSettings {
}
/**
 * Unofficial client for the public Lidl Plus store & offers endpoints.
 * All methods resolve with plain, schema-validated JSON data or reject
 * (throw) with a {@link LidlAPIError} / {@link LidlStoreNotFoundError}.
 */
export declare class LidlPlus {
    readonly country: string;
    readonly language: string;
    readonly latitude: number;
    readonly longitude: number;
    private readonly storesBaseUrl;
    private readonly offersBaseUrl;
    private readonly appVersion;
    private readonly timeout;
    constructor(options?: LidlPlusOptions);
    private get headers();
    private get;
    /** List every store in `country`. */
    stores(): Promise<StoreData[]>;
    /** Search stores via the Lidl Plus autocomplete endpoint, falling back to a local catalog scan. */
    searchStores(query: string, limit?: number): Promise<StoreData[]>;
    /** Search the full store catalog by substring match on key fields. */
    searchStoresFromCatalog(query: string, limit?: number): Promise<StoreData[]>;
    private rankStores;
    /** Find the single best-matching store, or throw {@link LidlStoreNotFoundError}. */
    findStore(query: string): Promise<StoreData>;
    /** Current offers for a given store key. */
    offers(storeKey: string): Promise<OffersResponseData>;
    /** Convenience: find a store by search query, then load its offers. */
    offersForStoreSearch(query: string): Promise<{
        store: StoreData;
        offers: OffersResponseData;
    }>;
}
//# sourceMappingURL=client.d.ts.map
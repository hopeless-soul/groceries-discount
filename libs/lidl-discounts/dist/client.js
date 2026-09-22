import { APP_VERSION, COUNTRY_DEFAULTS, DEFAULT_TIMEOUT_MS, OFFERS_BASE_URL, STORES_BASE_URL, } from "./config.js";
import { LidlAPIError, LidlStoreNotFoundError } from "./errors.js";
import { getStoreLabel } from "./format.js";
import { OffersResponseSchema, StoreListSchema, } from "./types.js";
function ensureTrailingSlash(url) {
    return url.endsWith("/") ? url : `${url}/`;
}
function tokenize(query) {
    return query
        .split(/\s+/)
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean);
}
function parseOrThrow(schema, data, context) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new LidlAPIError(`${context}: response did not match the expected schema (${result.error.message})`, { cause: result.error });
    }
    return result.data;
}
/**
 * Unofficial client for the public Lidl Plus store & offers endpoints.
 * All methods resolve with plain, schema-validated JSON data or reject
 * (throw) with a {@link LidlAPIError} / {@link LidlStoreNotFoundError}.
 */
export class LidlPlus {
    constructor(options = {}) {
        this.country = (options.country ?? "DE").toUpperCase();
        const defaults = COUNTRY_DEFAULTS[this.country] ?? COUNTRY_DEFAULTS.DE;
        this.language = options.language ?? defaults.language;
        this.latitude = options.latitude ?? defaults.latitude;
        this.longitude = options.longitude ?? defaults.longitude;
        this.storesBaseUrl = ensureTrailingSlash(options.storesBaseUrl ?? STORES_BASE_URL);
        this.offersBaseUrl = ensureTrailingSlash(options.offersBaseUrl ?? OFFERS_BASE_URL);
        this.appVersion = options.appVersion ?? APP_VERSION;
        this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    }
    get headers() {
        return {
            Accept: "application/json",
            "Accept-Language": this.language,
            "User-Agent": `LidlPlus/${this.appVersion} Android okhttp/4.12.0`,
            "X-Client-Version": this.appVersion,
            "X-Client-Platform": "android",
        };
    }
    async get(url, params) {
        const fullUrl = new URL(url);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                fullUrl.searchParams.set(key, String(value));
            }
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);
        let response;
        try {
            response = await fetch(fullUrl.toString(), {
                headers: this.headers,
                signal: controller.signal,
            });
        }
        catch (err) {
            throw new LidlAPIError(`GET ${url} failed: ${err.message}`, { cause: err });
        }
        finally {
            clearTimeout(timer);
        }
        if (!response.ok) {
            const body = (await response.text().catch(() => "")).slice(0, 500);
            throw new LidlAPIError(`GET ${url} failed with HTTP ${response.status}: ${body}`);
        }
        try {
            return await response.json();
        }
        catch (err) {
            throw new LidlAPIError(`GET ${url} did not return valid JSON`, { cause: err });
        }
    }
    /** List every store in `country`. */
    async stores() {
        const data = await this.get(`${this.storesBaseUrl}v4/${this.country}`);
        return parseOrThrow(StoreListSchema, data, "stores()");
    }
    /** Search stores via the Lidl Plus autocomplete endpoint, falling back to a local catalog scan. */
    async searchStores(query, limit = 10) {
        const data = await this.get(`${this.storesBaseUrl}v1/autocomplete/${this.country}`, {
            input: query,
            language: this.language.split("-", 1)[0],
            latitude: this.latitude,
            longitude: this.longitude,
        });
        const stores = parseOrThrow(StoreListSchema, data, "searchStores()");
        if (stores.length > 0) {
            return this.rankStores(query, stores).slice(0, limit);
        }
        return this.searchStoresFromCatalog(query, limit);
    }
    /** Search the full store catalog by substring match on key fields. */
    async searchStoresFromCatalog(query, limit = 10) {
        const terms = tokenize(query);
        const allStores = await this.stores();
        const matches = allStores.filter((store) => {
            const searchable = [store.storeKey, store.name, store.address, store.postalCode, store.locality]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return terms.every((term) => searchable.includes(term));
        });
        return this.rankStores(query, matches).slice(0, limit);
    }
    rankStores(query, stores) {
        const terms = tokenize(query);
        const weights = {
            storeKey: 30,
            name: 25,
            locality: 25,
            postalCode: 20,
            address: 5,
        };
        const score = (store) => {
            const fields = {
                storeKey: store.storeKey,
                name: store.name,
                locality: store.locality,
                postalCode: store.postalCode,
                address: store.address,
            };
            let total = 0;
            for (const [field, value] of Object.entries(fields)) {
                const text = (value ?? "").toLowerCase();
                for (const term of terms) {
                    if (text === term)
                        total += weights[field] * 3;
                    else if (text.startsWith(term))
                        total += weights[field] * 2;
                    else if (text.includes(term))
                        total += weights[field];
                }
            }
            return total;
        };
        return [...stores].sort((a, b) => {
            const scoreDiff = score(b) - score(a);
            if (scoreDiff !== 0)
                return scoreDiff;
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            return distA - distB;
        });
    }
    /** Find the single best-matching store, or throw {@link LidlStoreNotFoundError}. */
    async findStore(query) {
        const [match] = await this.searchStores(query, 1);
        if (!match) {
            throw new LidlStoreNotFoundError(`No Lidl store found for "${query}" in ${this.country}.`);
        }
        if (!match.storeKey) {
            throw new LidlStoreNotFoundError(`Matched Lidl store has no storeKey: ${getStoreLabel(match)}`);
        }
        return match;
    }
    /** Current offers for a given store key. */
    async offers(storeKey) {
        const data = await this.get(`${this.offersBaseUrl}v4/${this.country}/${storeKey}/offers`);
        return parseOrThrow(OffersResponseSchema, data, "offers()");
    }
    /** Convenience: find a store by search query, then load its offers. */
    async offersForStoreSearch(query) {
        const store = await this.findStore(query);
        const offers = await this.offers(store.storeKey ?? "");
        return { store, offers };
    }
}
//# sourceMappingURL=client.js.map
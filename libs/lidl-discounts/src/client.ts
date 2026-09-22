import {
  APP_VERSION,
  COUNTRY_DEFAULTS,
  DEFAULT_TIMEOUT_MS,
  type LidlSettings,
  OFFERS_BASE_URL,
  STORES_BASE_URL,
} from "./config.js";
import { LidlAPIError, LidlStoreNotFoundError } from "./errors.js";
import { getStoreLabel } from "./format.js";
import {
  type OffersResponseData,
  OffersResponseSchema,
  type StoreData,
  StoreListSchema,
} from "./types.js";
import type { z } from "zod";

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function tokenize(query: string): string[] {
  return query
    .split(/\s+/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

function parseOrThrow<S extends z.ZodTypeAny>(schema: S, data: unknown, context: string): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new LidlAPIError(
      `${context}: response did not match the expected schema (${result.error.message})`,
      { cause: result.error },
    );
  }
  return result.data;
}

export interface LidlPlusOptions extends LidlSettings {}

/**
 * Unofficial client for the public Lidl Plus store & offers endpoints.
 * All methods resolve with plain, schema-validated JSON data or reject
 * (throw) with a {@link LidlAPIError} / {@link LidlStoreNotFoundError}.
 */
export class LidlPlus {
  readonly country: string;
  readonly language: string;
  readonly latitude: number;
  readonly longitude: number;

  private readonly storesBaseUrl: string;
  private readonly offersBaseUrl: string;
  private readonly appVersion: string;
  private readonly timeout: number;

  constructor(options: LidlPlusOptions = {}) {
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

  private get headers(): Record<string, string> {
    return {
      Accept: "application/json",
      "Accept-Language": this.language,
      "User-Agent": `LidlPlus/${this.appVersion} Android okhttp/4.12.0`,
      "X-Client-Version": this.appVersion,
      "X-Client-Platform": "android",
    };
  }

  private async get(
    url: string,
    params?: Record<string, string | number>,
  ): Promise<unknown> {
    const fullUrl = new URL(url);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        fullUrl.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await fetch(fullUrl.toString(), {
        headers: this.headers,
        signal: controller.signal,
      });
    } catch (err) {
      throw new LidlAPIError(`GET ${url} failed: ${(err as Error).message}`, { cause: err });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const body = (await response.text().catch(() => "")).slice(0, 500);
      throw new LidlAPIError(`GET ${url} failed with HTTP ${response.status}: ${body}`);
    }

    try {
      return await response.json();
    } catch (err) {
      throw new LidlAPIError(`GET ${url} did not return valid JSON`, { cause: err });
    }
  }

  /** List every store in `country`. */
  async stores(): Promise<StoreData[]> {
    const data = await this.get(`${this.storesBaseUrl}v4/${this.country}`);
    return parseOrThrow(StoreListSchema, data, "stores()");
  }

  /** Search stores via the Lidl Plus autocomplete endpoint, falling back to a local catalog scan. */
  async searchStores(query: string, limit = 10): Promise<StoreData[]> {
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
  async searchStoresFromCatalog(query: string, limit = 10): Promise<StoreData[]> {
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

  private rankStores(query: string, stores: StoreData[]): StoreData[] {
    const terms = tokenize(query);
    const weights: Record<string, number> = {
      storeKey: 30,
      name: 25,
      locality: 25,
      postalCode: 20,
      address: 5,
    };

    const score = (store: StoreData): number => {
      const fields: Record<string, string | null | undefined> = {
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
          if (text === term) total += weights[field] * 3;
          else if (text.startsWith(term)) total += weights[field] * 2;
          else if (text.includes(term)) total += weights[field];
        }
      }
      return total;
    };

    return [...stores].sort((a, b) => {
      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      const distA = a.distance ?? Infinity;
      const distB = b.distance ?? Infinity;
      return distA - distB;
    });
  }

  /** Find the single best-matching store, or throw {@link LidlStoreNotFoundError}. */
  async findStore(query: string): Promise<StoreData> {
    const [match] = await this.searchStores(query, 1);
    if (!match) {
      throw new LidlStoreNotFoundError(`No Lidl store found for "${query}" in ${this.country}.`);
    }
    if (!match.storeKey) {
      throw new LidlStoreNotFoundError(
        `Matched Lidl store has no storeKey: ${getStoreLabel(match)}`,
      );
    }
    return match;
  }

  /** Current offers for a given store key. */
  async offers(storeKey: string): Promise<OffersResponseData> {
    const data = await this.get(`${this.offersBaseUrl}v4/${this.country}/${storeKey}/offers`);
    return parseOrThrow(OffersResponseSchema, data, "offers()");
  }

  /** Convenience: find a store by search query, then load its offers. */
  async offersForStoreSearch(
    query: string,
  ): Promise<{ store: StoreData; offers: OffersResponseData }> {
    const store = await this.findStore(query);
    const offers = await this.offers(store.storeKey ?? "");
    return { store, offers };
  }
}

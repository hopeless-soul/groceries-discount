export interface CountryDefaults {
    language: string;
    latitude: number;
    longitude: number;
}
export declare const STORES_BASE_URL = "https://stores.lidlplus.com/api/";
export declare const OFFERS_BASE_URL = "https://offers.lidlplus.com/app/api/";
export declare const APP_VERSION = "17.0.5";
/** Default timeout in milliseconds (the Python client used seconds). */
export declare const DEFAULT_TIMEOUT_MS = 20000;
export declare const COUNTRY_DEFAULTS: Record<string, CountryDefaults>;
export interface LidlSettings {
    storesBaseUrl?: string;
    offersBaseUrl?: string;
    appVersion?: string;
    country?: string;
    /** Request timeout in milliseconds. Default: 20000. */
    timeout?: number;
    language?: string;
    latitude?: number;
    longitude?: number;
}
//# sourceMappingURL=config.d.ts.map
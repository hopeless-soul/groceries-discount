export interface CountryDefaults {
  language: string;
  latitude: number;
  longitude: number;
}

export const STORES_BASE_URL = "https://stores.lidlplus.com/api/";
export const OFFERS_BASE_URL = "https://offers.lidlplus.com/app/api/";
export const APP_VERSION = "17.0.5";

/** Default timeout in milliseconds (the Python client used seconds). */
export const DEFAULT_TIMEOUT_MS = 20_000;

export const COUNTRY_DEFAULTS: Record<string, CountryDefaults> = {
  DE: { language: "de-DE", latitude: 52.52, longitude: 13.405 },
  AT: { language: "de-AT", latitude: 48.2082, longitude: 16.3738 },
  ES: { language: "es-ES", latitude: 40.4168, longitude: -3.7038 },
  FR: { language: "fr-FR", latitude: 48.8566, longitude: 2.3522 },
  NL: { language: "nl-NL", latitude: 52.3676, longitude: 4.9041 },
  PL: { language: "pl-PL", latitude: 52.2297, longitude: 21.0122 },
  SK: { language: "sk-SK", latitude: 48.1486, longitude: 17.1077 },
};

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

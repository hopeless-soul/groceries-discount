export { LidlPlus } from "./client.js";
export type { LidlPlusOptions } from "./client.js";

export { LidlAPIError, LidlStoreNotFoundError } from "./errors.js";

export {
  COUNTRY_DEFAULTS,
  DEFAULT_TIMEOUT_MS,
  APP_VERSION,
  STORES_BASE_URL,
  OFFERS_BASE_URL,
} from "./config.js";
export type { CountryDefaults, LidlSettings } from "./config.js";

export {
  LocationSchema,
  StoreSchema,
  StoreListSchema,
  PriceBoxSchema,
  OfferSchema,
  OffersResponseSchema,
} from "./types.js";
export type {
  LocationData,
  StoreData,
  PriceBoxData,
  OfferData,
  OffersResponseData,
} from "./types.js";

export {
  getStoreLabel,
  getStoreTitle,
  offerName,
  getOfferLabel,
  formatDate,
  getOfferPeriod,
  formatPrice,
  getPriceBoxPrice,
  getPriceBoxOldPrice,
  getOfferPrice,
  getOfferOldPrice,
  stripFootnoteMarkers,
  getOfferDiscount,
} from "./format.js";

export { distanceKm } from "./utils.js";

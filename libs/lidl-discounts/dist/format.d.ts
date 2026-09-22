import type { OfferData, PriceBoxData, StoreData } from "./types.js";
/**
 * Pure display-formatting helpers ported from the Python models' computed
 * properties (`Store.label`, `Offer.price`, etc). They take already-validated
 * data and return plain strings — nothing here does I/O or throws.
 */
export declare function getStoreLabel(store: StoreData): string;
export declare function getStoreTitle(store: StoreData): string;
export declare function offerName(brand: string | null | undefined, title: string | null | undefined, fallback: string | null | undefined): string;
export declare function getOfferLabel(offer: OfferData): string;
export declare function formatDate(value: string | null | undefined): string | null;
export declare function getOfferPeriod(offer: OfferData): string;
export declare function formatPrice(numeric: number | null | undefined, text: string | null | undefined, symbol: string | null | undefined): string;
export declare function getPriceBoxPrice(priceBox: PriceBoxData): string;
export declare function getPriceBoxOldPrice(priceBox: PriceBoxData): string;
export declare function getOfferPrice(offer: OfferData): string;
export declare function getOfferOldPrice(offer: OfferData): string;
export declare function stripFootnoteMarkers(value: string | null | undefined): string;
export declare function getOfferDiscount(offer: OfferData): string;
//# sourceMappingURL=format.d.ts.map
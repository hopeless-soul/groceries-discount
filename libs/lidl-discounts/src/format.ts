import type { OfferData, PriceBoxData, StoreData } from "./types.js";

/**
 * Pure display-formatting helpers ported from the Python models' computed
 * properties (`Store.label`, `Offer.price`, etc). They take already-validated
 * data and return plain strings — nothing here does I/O or throws.
 */

export function getStoreLabel(store: StoreData): string {
  const postcodeAndCity = [store.postalCode, store.locality].filter(Boolean).join(" ") || null;
  return [store.name, store.address, postcodeAndCity].filter(Boolean).join(", ");
}

export function getStoreTitle(store: StoreData): string {
  if (store.name) return store.name;
  if (store.storeKey) return `Lidl ${store.storeKey}`;
  return "Lidl";
}

export function offerName(
  brand: string | null | undefined,
  title: string | null | undefined,
  fallback: string | null | undefined,
): string {
  if (brand && title) return `${brand} - ${title}`;
  return title || brand || fallback || "-";
}

export function getOfferLabel(offer: OfferData): string {
  return [offer.brand, offer.title].filter(Boolean).join(" ") || offer.id || "-";
}

export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return value.slice(0, 10) || value;
}

export function getOfferPeriod(offer: OfferData): string {
  const start = formatDate(offer.startValidityDate);
  const end = formatDate(offer.endValidityDate);
  if (start && end) return `${start} - ${end}`;
  return start || end || "-";
}

function trimTrailingZeros(value: string): string {
  return value.replace(/0+$/, "").replace(/\.$/, "");
}

export function formatPrice(
  numeric: number | null | undefined,
  text: string | null | undefined,
  symbol: string | null | undefined,
): string {
  const value = text ?? (numeric != null ? trimTrailingZeros(numeric.toFixed(2)) : null);
  if (!value) return "-";
  return symbol ? `${value} ${symbol}` : value;
}

export function getPriceBoxPrice(priceBox: PriceBoxData): string {
  return formatPrice(priceBox.largePartNumeric, priceBox.largePartString, priceBox.priceSymbol);
}

export function getPriceBoxOldPrice(priceBox: PriceBoxData): string {
  return formatPrice(priceBox.smallPartNumeric, priceBox.smallPartString, priceBox.priceSymbol);
}

export function getOfferPrice(offer: OfferData): string {
  return offer.priceBox ? getPriceBoxPrice(offer.priceBox) : "-";
}

export function getOfferOldPrice(offer: OfferData): string {
  return offer.priceBox ? getPriceBoxOldPrice(offer.priceBox) : "-";
}

/** Matches Unicode category "No" (Number, other) — footnote-style superscripts etc. */
const FOOTNOTE_MARKER_PATTERN = /\p{No}/gu;

export function stripFootnoteMarkers(value: string | null | undefined): string {
  if (!value) return "-";
  const cleaned = value.replace(FOOTNOTE_MARKER_PATTERN, "").replace(/⁾/g, "").trim();
  return cleaned || "-";
}

export function getOfferDiscount(offer: OfferData): string {
  if (!offer.priceBox) return "-";
  return stripFootnoteMarkers(offer.priceBox.discountMessage);
}

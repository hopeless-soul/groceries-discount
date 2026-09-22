/**
 * Pure display-formatting helpers ported from the Python models' computed
 * properties (`Store.label`, `Offer.price`, etc). They take already-validated
 * data and return plain strings — nothing here does I/O or throws.
 */
export function getStoreLabel(store) {
    const postcodeAndCity = [store.postalCode, store.locality].filter(Boolean).join(" ") || null;
    return [store.name, store.address, postcodeAndCity].filter(Boolean).join(", ");
}
export function getStoreTitle(store) {
    if (store.name)
        return store.name;
    if (store.storeKey)
        return `Lidl ${store.storeKey}`;
    return "Lidl";
}
export function offerName(brand, title, fallback) {
    if (brand && title)
        return `${brand} - ${title}`;
    return title || brand || fallback || "-";
}
export function getOfferLabel(offer) {
    return [offer.brand, offer.title].filter(Boolean).join(" ") || offer.id || "-";
}
export function formatDate(value) {
    if (!value)
        return null;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }
    return value.slice(0, 10) || value;
}
export function getOfferPeriod(offer) {
    const start = formatDate(offer.startValidityDate);
    const end = formatDate(offer.endValidityDate);
    if (start && end)
        return `${start} - ${end}`;
    return start || end || "-";
}
function trimTrailingZeros(value) {
    return value.replace(/0+$/, "").replace(/\.$/, "");
}
export function formatPrice(numeric, text, symbol) {
    const value = text ?? (numeric != null ? trimTrailingZeros(numeric.toFixed(2)) : null);
    if (!value)
        return "-";
    return symbol ? `${value} ${symbol}` : value;
}
export function getPriceBoxPrice(priceBox) {
    return formatPrice(priceBox.largePartNumeric, priceBox.largePartString, priceBox.priceSymbol);
}
export function getPriceBoxOldPrice(priceBox) {
    return formatPrice(priceBox.smallPartNumeric, priceBox.smallPartString, priceBox.priceSymbol);
}
export function getOfferPrice(offer) {
    return offer.priceBox ? getPriceBoxPrice(offer.priceBox) : "-";
}
export function getOfferOldPrice(offer) {
    return offer.priceBox ? getPriceBoxOldPrice(offer.priceBox) : "-";
}
/** Matches Unicode category "No" (Number, other) — footnote-style superscripts etc. */
const FOOTNOTE_MARKER_PATTERN = /\p{No}/gu;
export function stripFootnoteMarkers(value) {
    if (!value)
        return "-";
    const cleaned = value.replace(FOOTNOTE_MARKER_PATTERN, "").replace(/⁾/g, "").trim();
    return cleaned || "-";
}
export function getOfferDiscount(offer) {
    if (!offer.priceBox)
        return "-";
    return stripFootnoteMarkers(offer.priceBox.discountMessage);
}
//# sourceMappingURL=format.js.map
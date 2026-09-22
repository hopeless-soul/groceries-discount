import { getDomain, httpGet } from "./common.js";
function normalize(text) {
    return (text ?? "")
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
}
function parseOpeningHours(wod) {
    return (wod ?? []).map((entry) => {
        const [day, open, close] = entry.split("|");
        return { day: day, open: open ?? "", close: close ?? "" };
    });
}
function parseStore(raw) {
    const storeCode = raw.n;
    const opened = raw.opd || null;
    const closed = raw.eod || null;
    return {
        store_code: storeCode,
        country_code: storeCode.slice(0, 2),
        store_number: storeCode.slice(2),
        name: raw.cn ?? "",
        city: raw.t ?? "",
        street: raw.sn ?? "",
        postal_code: raw.pc ?? "",
        phone: raw.p ?? null,
        latitude: Number.parseFloat(raw.lat),
        longitude: Number.parseFloat(raw.lng),
        opening_hours: parseOpeningHours(raw.wod),
        opened_date: opened ? opened.slice(0, 10) : null,
        closed_date: closed ? closed.slice(0, 10) : null,
        friendly_url: raw.friendlyUrl ?? "",
        services: raw.slf ? raw.slf.split(",") : [],
    };
}
export async function fetchStoreList(countryCode, httpOptions = {}) {
    const domain = getDomain(countryCode);
    const url = `https://${domain}/.klstorefinder.json`;
    const text = await httpGet(url, httpOptions);
    const rawList = JSON.parse(text);
    return rawList.map(parseStore);
}
/**
 * Resolve a country + free-text city into matching {@link Store} records.
 * Matching is diacritic- and case-insensitive against both `city` and `name`.
 * Results are sorted with exact-city matches first, then alphabetically by city.
 */
export async function findStores(countryCode, city, options = {}) {
    const { exact = false, ...httpOptions } = options;
    const target = normalize(city);
    const stores = await fetchStoreList(countryCode, httpOptions);
    const matches = (store) => {
        const cityNorm = normalize(store.city);
        const nameNorm = normalize(store.name);
        if (exact) {
            return target === cityNorm || target === nameNorm;
        }
        return cityNorm.includes(target) || nameNorm.includes(target);
    };
    const results = stores.filter(matches);
    results.sort((a, b) => {
        const aRank = normalize(a.city) === target ? 0 : 1;
        const bRank = normalize(b.city) === target ? 0 : 1;
        if (aRank !== bRank)
            return aRank - bRank;
        return a.city < b.city ? -1 : a.city > b.city ? 1 : 0;
    });
    return results;
}
//# sourceMappingURL=findStore.js.map
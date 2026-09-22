/**
 * Public data shapes. These mirror ../../docs/schemas/*.schema.json field-for-field --
 * keep the two in sync if either changes. See docs/typescript-api.md for the mapping.
 */
export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export interface OpeningHours {
    day: Weekday;
    open: string;
    close: string;
}
/** schemas/store.schema.json */
export interface Store {
    store_code: string;
    country_code: string;
    store_number: string;
    name: string;
    city: string;
    street: string;
    postal_code: string;
    phone: string | null;
    latitude: number;
    longitude: number;
    opening_hours: OpeningHours[];
    opened_date: string | null;
    closed_date: string | null;
    friendly_url: string;
    services: string[];
}
/** schemas/offer.schema.json */
export interface Offer {
    offer_id: string;
    article_number: string;
    store_code: string;
    title: string;
    subtitle: string | null;
    unit: string;
    price: number;
    old_price: number | null;
    currency: string;
    discount_percent: number | null;
    base_price_text: string | null;
    valid_from: string;
    valid_to: string;
    category_id: string;
    category_name: string;
    label: string | null;
    loyalty_discount: number;
    image_url: string | null;
}
/** schemas/category.schema.json */
export interface Category {
    category_id: string;
    category_name: string;
    valid_from: string | null;
    valid_to: string | null;
    main: boolean | null;
    order: string | null;
    offer_count: number;
}
export interface Week {
    current_week_dates: string[];
    next_week_dates: string[];
}
/** schemas/discounts_response.schema.json */
export interface DiscountsResponse {
    store_code: string;
    /** Present once a store lookup has happened (e.g. via `lookupDiscounts`); omitted from a bare `fetchDiscounts` call. */
    store?: Store;
    fetched_at: string;
    week: Week;
    category_count: number;
    categories: Category[];
    offer_count: number;
    offers: Offer[];
}

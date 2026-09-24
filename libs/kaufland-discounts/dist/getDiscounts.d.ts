import { type HttpGetOptions } from "./common.js";
import type { DiscountsResponse } from "./types.js";
/** Raw shape of one offer inside a category's `offers[]` -- see docs/api-reference.md §3. */
interface RawOffer {
    offerId?: string;
    klNr?: string;
    title?: string;
    subtitle?: string;
    unit?: string;
    price?: number;
    formattedPrice?: string;
    formattedOldPrice?: string;
    discount?: number;
    basePrice?: string;
    formattedBasePrice?: string;
    dateFrom?: string;
    dateTo?: string;
    label?: string;
    /** Kaufland Card ("Xtra") tier -- present only on offers with a card-holder price. */
    loyaltyDiscount?: number;
    loyaltyFormattedPrice?: string;
    loyaltyFormattedOldPrice?: string;
    loyaltyBasePrice?: string;
    loyaltyFormattedBasePrice?: string;
    listImage?: string;
}
interface RawCategory {
    offerCategoryId?: string;
    displayName?: string;
    dateFrom?: string;
    dateTo?: string;
    main?: boolean;
    order?: string;
    offers?: RawOffer[];
}
interface RawCycle {
    categories?: RawCategory[];
}
interface OfferTemplateProps {
    weekData?: {
        currentWeekDates?: string[];
        nextWeekDates?: string[];
    };
    offerData?: {
        cycles?: RawCycle[];
    };
}
interface OfferTemplate {
    component: "OfferTemplate";
    props?: OfferTemplateProps;
}
/** Locate and parse the `window.SSR['<uuid>'] = {"component":"OfferTemplate",...}` block. */
export declare function extractOfferTemplate(html: string): OfferTemplate;
export declare function buildDiscountsResponse(storeCode: string, props: OfferTemplateProps): DiscountsResponse;
/** Given a store code, fetch that store's full current-week discount list. */
export declare function fetchDiscounts(storeCode: string, httpOptions?: HttpGetOptions): Promise<DiscountsResponse>;
export {};

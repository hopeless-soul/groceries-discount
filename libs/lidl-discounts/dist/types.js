import { z } from "zod";
/**
 * All response schemas use `.passthrough()` so unknown fields from the Lidl
 * Plus API survive validation instead of being stripped (mirrors the Python
 * client's `extra="allow"` Pydantic config).
 */
export const LocationSchema = z
    .object({
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
})
    .passthrough();
export const StoreSchema = z
    .object({
    storeKey: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    locality: z.string().nullable().optional(),
    distance: z.number().nullable().optional(),
    location: LocationSchema.nullable().optional(),
})
    .passthrough();
export const PriceBoxSchema = z
    .object({
    priceSymbol: z.string().nullable().optional(),
    discountMessage: z.string().nullable().optional(),
    largePartNumeric: z.number().nullable().optional(),
    largePartString: z.string().nullable().optional(),
    smallPartNumeric: z.number().nullable().optional(),
    smallPartString: z.string().nullable().optional(),
})
    .passthrough();
export const OfferSchema = z
    .object({
    id: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    brand: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    offerType: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    startValidityDate: z.string().nullable().optional(),
    endValidityDate: z.string().nullable().optional(),
    priceBox: PriceBoxSchema.nullable().optional(),
    packaging: z.string().nullable().optional(),
    pricePerUnit: z.string().nullable().optional(),
})
    .passthrough();
export const OffersResponseSchema = z
    .object({
    offers: z.array(OfferSchema).default([]),
    totalOffers: z.number().nullable().optional(),
})
    .passthrough();
export const StoreListSchema = z.array(StoreSchema);
//# sourceMappingURL=types.js.map
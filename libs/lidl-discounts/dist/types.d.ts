import { z } from "zod";
/**
 * All response schemas use `.passthrough()` so unknown fields from the Lidl
 * Plus API survive validation instead of being stripped (mirrors the Python
 * client's `extra="allow"` Pydantic config).
 */
export declare const LocationSchema: z.ZodObject<{
    latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.ZodTypeAny, "passthrough">>;
export type LocationData = z.infer<typeof LocationSchema>;
export declare const StoreSchema: z.ZodObject<{
    storeKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    locality: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    storeKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    locality: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    storeKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    locality: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>>;
}, z.ZodTypeAny, "passthrough">>;
export type StoreData = z.infer<typeof StoreSchema>;
export declare const PriceBoxSchema: z.ZodObject<{
    priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export type PriceBoxData = z.infer<typeof PriceBoxSchema>;
export declare const OfferSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>>>;
    packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>>>;
    packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>>>;
    packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export type OfferData = z.infer<typeof OfferSchema>;
export declare const OffersResponseSchema: z.ZodObject<{
    offers: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>>>;
        packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>>>;
        packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>>>;
        packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    totalOffers: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    offers: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>>>;
        packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>>>;
        packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>>>;
        packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    totalOffers: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    offers: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>>>;
        packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>>>;
        packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        offerType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endValidityDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        priceBox: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            priceSymbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            discountMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            largePartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            largePartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            smallPartNumeric: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            smallPartString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>>>;
        packaging: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        pricePerUnit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    totalOffers: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.ZodTypeAny, "passthrough">>;
export type OffersResponseData = z.infer<typeof OffersResponseSchema>;
export declare const StoreListSchema: z.ZodArray<z.ZodObject<{
    storeKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    locality: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    storeKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    locality: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    storeKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    locality: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>>;
}, z.ZodTypeAny, "passthrough">>, "many">;
//# sourceMappingURL=types.d.ts.map
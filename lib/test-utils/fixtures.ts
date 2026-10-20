import type { DisplayOffer } from "@/lib/types";

/** A DisplayOffer with sensible defaults; override only what a test cares about. */
export function makeDisplayOffer(overrides: Partial<DisplayOffer> = {}): DisplayOffer {
  return {
    id: "o1",
    shop: "lidl",
    displayTitle: "Milk",
    displaySubtitle: null,
    category: ["beverages"],
    basePrice: 2,
    discountedPrice: 1,
    loyaltyPrice: null,
    loyaltyDiscount: null,
    displayDiscount: 50,
    validFrom: "2026-09-20",
    validTo: "2026-09-22",
    daysLeft: 4,
    ringPercent: 50,
    imageUrl: "https://api.example.com/pages/p1/image",
    isCropped: false,
    boundaryBox: [[0, 0], [1, 1]],
    ...overrides,
  };
}

import { describe, expect, it } from "vitest";
import type { OfferDto } from "./dto";
import { normalizeOffer, normalizeOffers } from "./normalize";

const base: OfferDto = {
  id: "o1",
  pageId: "kaufland_2026-10-14_2026-10-20_page_01",
  flyerId: "kaufland_2026-10-14_2026-10-20",
  shop: "kaufland",
  position: 0,
  title: "Milk 1l",
  category: ["beverages"],
  basePrice: 1.2,
  discountedPrice: 0.9,
  discount: 25,
  loyaltyPrice: null,
  loyaltyDiscount: null,
  validFrom: "2026-10-14",
  validTo: "2026-10-20",
  imageUrl: "https://api.example.com/pages/p1/image",
  boundaryBox: [[0.1, 0.2], [0.4, 0.5]],
};

const API = "https://api.example.com";

describe("normalizeOffer", () => {
  it("defaults a null category to ['other']", () => {
    expect(normalizeOffer({ ...base, category: null }, API).category).toEqual(["other"]);
  });

  it("keeps null prices as null", () => {
    const offer = normalizeOffer(
      { ...base, basePrice: null, discountedPrice: null, loyaltyPrice: null },
      API,
    );
    expect(offer.basePrice).toBeNull();
    expect(offer.discountedPrice).toBeNull();
    expect(offer.loyaltyPrice).toBeNull();
  });

  it("always marks the image as cropped", () => {
    expect(normalizeOffer(base, API).isCropped).toBe(true);
  });

  it("prefixes a relative image path with the base URL", () => {
    const offer = normalizeOffer({ ...base, imageUrl: "/pages/p1/image" }, API);
    expect(offer.imageUrl).toBe("https://api.example.com/pages/p1/image");
  });

  it("keeps an absolute image URL unchanged", () => {
    expect(normalizeOffer(base, API).imageUrl).toBe(base.imageUrl);
  });

  it("drops position", () => {
    expect(normalizeOffer(base, API)).not.toHaveProperty("position");
  });
});

describe("normalizeOffers", () => {
  it("sorts by position before normalizing", () => {
    const offers = normalizeOffers(
      [
        { ...base, id: "late", position: 2 },
        { ...base, id: "first", position: 0 },
        { ...base, id: "middle", position: 1 },
      ],
      API,
    );
    expect(offers.map((o) => o.id)).toEqual(["first", "middle", "late"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      { ...base, id: "b", position: 1 },
      { ...base, id: "a", position: 0 },
    ];
    normalizeOffers(input, API);
    expect(input.map((o) => o.id)).toEqual(["b", "a"]);
  });
});

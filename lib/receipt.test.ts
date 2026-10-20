import { describe, expect, it } from "vitest";
import { groupCartItemsByStore } from "./receipt";
import { makeDisplayOffer } from "@/lib/test-utils/fixtures";

describe("groupCartItemsByStore", () => {
  it("returns an empty summary for an empty cart", () => {
    expect(groupCartItemsByStore([])).toEqual({ groups: [], grandTotal: 0, grandSavings: 0 });
  });

  it("groups a single store's items and computes subtotal/savings", () => {
    const items = [
      makeDisplayOffer({ id: "o1", basePrice: 2, discountedPrice: 1 }),
      makeDisplayOffer({ id: "o2", basePrice: 5, discountedPrice: 4 }),
    ];
    const summary = groupCartItemsByStore(items);
    expect(summary.groups).toEqual([
      { storeId: "lidl", storeLabel: "Lidl", items, subtotal: 5, savings: 2 },
    ]);
    expect(summary.grandTotal).toBe(5);
    expect(summary.grandSavings).toBe(2);
  });

  it("uses the loyalty price as the paid price when present", () => {
    const items = [makeDisplayOffer({ basePrice: 10, discountedPrice: 8, loyaltyPrice: 6 })];
    const summary = groupCartItemsByStore(items);
    expect(summary.grandTotal).toBe(6);
    expect(summary.grandSavings).toBe(4);
  });

  it("groups items from multiple stores in first-seen order", () => {
    const lidlItem = makeDisplayOffer({ id: "o1", shop: "lidl", basePrice: 2, discountedPrice: 1 });
    const kauflandItem = makeDisplayOffer({ id: "o2", shop: "kaufland", basePrice: 10, discountedPrice: 8 });
    const lidlItem2 = makeDisplayOffer({ id: "o3", shop: "lidl", basePrice: 3, discountedPrice: 3 });

    const summary = groupCartItemsByStore([lidlItem, kauflandItem, lidlItem2]);

    expect(summary.groups.map((g) => g.storeId)).toEqual(["lidl", "kaufland"]);
    expect(summary.groups[0]).toEqual({
      storeId: "lidl",
      storeLabel: "Lidl",
      items: [lidlItem, lidlItem2],
      subtotal: 4,
      savings: 1,
    });
    expect(summary.groups[1]).toEqual({
      storeId: "kaufland",
      storeLabel: "Kaufland",
      items: [kauflandItem],
      subtotal: 8,
      savings: 2,
    });
    expect(summary.grandTotal).toBe(12);
    expect(summary.grandSavings).toBe(3);
  });
});

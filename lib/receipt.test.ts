import { describe, expect, it } from "vitest";
import { groupCartItemsByStore } from "./receipt";
import type { CartItem } from "@/lib/types";

function makeItem(overrides: Partial<CartItem>): CartItem {
  return {
    id: "o1",
    title: "Milk",
    subtitle: "",
    categoryId: "dairy",
    regularPrice: 2,
    discountedPrice: 1,
    discountPercent: 50,
    validUntil: "2026-09-22T00:00:00.000Z",
    daysLeft: 4,
    ringPercent: 50,
    imageUrl: null,
    storeId: "lidl",
    storeLabel: "Lidl",
    storeDotColor: "#2563eb",
    ...overrides,
  };
}

describe("groupCartItemsByStore", () => {
  it("returns an empty summary for an empty cart", () => {
    expect(groupCartItemsByStore([])).toEqual({ groups: [], grandTotal: 0, grandSavings: 0 });
  });

  it("groups a single store's items and computes subtotal/savings", () => {
    const items = [
      makeItem({ id: "o1", regularPrice: 2, discountedPrice: 1 }),
      makeItem({ id: "o2", regularPrice: 5, discountedPrice: 4 }),
    ];
    const summary = groupCartItemsByStore(items);
    expect(summary.groups).toEqual([
      {
        storeId: "lidl",
        storeLabel: "Lidl",
        items,
        subtotal: 5,
        savings: 2,
      },
    ]);
    expect(summary.grandTotal).toBe(5);
    expect(summary.grandSavings).toBe(2);
  });

  it("groups items from multiple stores in first-seen order", () => {
    const lidlItem = makeItem({ id: "o1", storeId: "lidl", storeLabel: "Lidl", regularPrice: 2, discountedPrice: 1 });
    const kauflandItem = makeItem({
      id: "o2",
      storeId: "kaufland",
      storeLabel: "Kaufland",
      regularPrice: 10,
      discountedPrice: 8,
    });
    const lidlItem2 = makeItem({ id: "o3", storeId: "lidl", storeLabel: "Lidl", regularPrice: 3, discountedPrice: 3 });

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

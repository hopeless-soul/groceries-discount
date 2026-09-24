import { describe, expect, it } from "vitest";
import { dedupeCategories, dedupeOffers, recomputeCategoryCounts } from "./dedupe";
import type { Category, Offer } from "@/lib/types";

function offer(overrides: Partial<Offer>): Offer {
  return {
    id: "id",
    title: "Milk",
    subtitle: "1L",
    categoryId: "dairy",
    regularPrice: 1.5,
    discountedPrice: 1.0,
    discountPercent: 33,
    validFrom: null,
    validUntil: "2026-01-01",
    daysLeft: 5,
    ringPercent: 50,
    imageUrl: null,
    ...overrides,
  };
}

describe("dedupeOffers", () => {
  it("drops offers with the same normalized title and price, keeping the first", () => {
    const offers = [
      offer({ id: "a", title: "Milk 1L" }),
      offer({ id: "b", title: "  milk 1l  " }),
      offer({ id: "c", title: "Milk 1L", regularPrice: 2.0 }),
    ];

    const result = dedupeOffers(offers);

    expect(result.map((o) => o.id)).toEqual(["a", "c"]);
  });

  it("keeps offers with different titles or prices", () => {
    const offers = [offer({ id: "a", title: "Milk" }), offer({ id: "b", title: "Bread" })];
    expect(dedupeOffers(offers)).toHaveLength(2);
  });
});

describe("dedupeCategories", () => {
  it("drops categories with the same normalized name and id, keeping the first", () => {
    const categories: Category[] = [
      { id: "dairy", name: "Dairy", count: 3 },
      { id: "DAIRY", name: " dairy ", count: 3 },
      { id: "bakery", name: "Bakery", count: 1 },
    ];

    const result = dedupeCategories(categories);

    expect(result.map((c) => c.id)).toEqual(["dairy", "bakery"]);
  });

  it("keeps categories with the same name but a different id", () => {
    const categories: Category[] = [
      { id: "dairy", name: "Dairy", count: 3 },
      { id: "dairy-fresh", name: "Dairy", count: 1 },
    ];
    expect(dedupeCategories(categories)).toHaveLength(2);
  });
});

describe("recomputeCategoryCounts", () => {
  it("derives each category's count from the offers that reference it", () => {
    const categories: Category[] = [
      { id: "dairy", name: "Dairy", count: 99 },
      { id: "bakery", name: "Bakery", count: 99 },
    ];
    const offers = [
      offer({ id: "a", categoryId: "dairy" }),
      offer({ id: "b", categoryId: "dairy" }),
    ];

    const result = recomputeCategoryCounts(categories, offers);

    expect(result).toEqual([
      { id: "dairy", name: "Dairy", count: 2 },
      { id: "bakery", name: "Bakery", count: 0 },
    ]);
  });
});

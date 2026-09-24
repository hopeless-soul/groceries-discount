import { describe, expect, it } from "vitest";
import { isOfferAvailable, splitByAvailability } from "./availability";
import type { DashboardData, Offer } from "./types";

const NOW = new Date("2026-09-24T12:00:00.000Z");

const offer = (id: string, validFrom: string | null, categoryId = "bakery"): Offer => ({
  id,
  title: id,
  subtitle: "",
  categoryId,
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validFrom,
  validUntil: "2026-09-30T00:00:00.000Z",
  daysLeft: 6,
  ringPercent: 10,
  imageUrl: null,
});

describe("isOfferAvailable", () => {
  it("is available once the start date has passed or is now", () => {
    expect(isOfferAvailable(offer("a", "2026-09-20T00:00:00.000Z"), NOW)).toBe(true);
    expect(isOfferAvailable(offer("a", NOW.toISOString()), NOW)).toBe(true);
  });

  it("is not available before the start date", () => {
    expect(isOfferAvailable(offer("a", "2026-09-25T00:00:00.000Z"), NOW)).toBe(false);
  });

  it("treats a missing start date as available", () => {
    expect(isOfferAvailable(offer("a", null), NOW)).toBe(true);
  });
});

describe("splitByAvailability", () => {
  it("separates upcoming offers and recounts categories from available ones only", () => {
    const data: DashboardData = {
      store: { id: "lidl", label: "Lidl", dotColor: "#000" },
      categories: [
        { id: "bakery", name: "Bakery", count: 2 },
        { id: "dairy", name: "Dairy", count: 1 },
      ],
      offers: [
        offer("started", "2026-09-20T00:00:00.000Z", "bakery"),
        offer("future-bakery", "2026-09-28T00:00:00.000Z", "bakery"),
        offer("future-dairy", "2026-09-28T00:00:00.000Z", "dairy"),
      ],
    };

    const { available, upcoming } = splitByAvailability(data, NOW);

    expect(available.offers.map((o) => o.id)).toEqual(["started"]);
    expect(upcoming.map((o) => o.id)).toEqual(["future-bakery", "future-dairy"]);
    expect(available.categories).toEqual([
      { id: "bakery", name: "Bakery", count: 1 },
      { id: "dairy", name: "Dairy", count: 0 },
    ]);
  });
});

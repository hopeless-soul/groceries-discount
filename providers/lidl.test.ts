import { afterEach, describe, expect, it, vi } from "vitest";
import { LidlProvider } from "./lidl";

const storeSearchResponse = [
  { storeKey: "SK1234", name: "Lidl Bratislava", locality: "Bratislava" },
];

const offersResponse = {
  totalOffers: 1,
  offers: [
    {
      id: "off-1",
      title: "Milk",
      brand: "Rajo",
      category: "Dairy & Eggs",
      startValidityDate: "2026-09-15T00:00:00.000Z",
      endValidityDate: "2026-09-22T00:00:00.000Z",
      packaging: "1 l",
      priceBox: {
        largePartNumeric: 0.99,
        smallPartNumeric: 1.29,
      },
    },
  ],
};

function mockFetchSequence(...responses: Array<{ ok: boolean; json: () => Promise<unknown> }>) {
  const impl = vi.fn();
  for (const response of responses) impl.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", impl);
  return impl;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LidlProvider", () => {
  it("finds a store then its offers and normalizes to DashboardData", async () => {
    mockFetchSequence(
      { ok: true, json: async () => storeSearchResponse },
      { ok: true, json: async () => offersResponse },
    );

    const provider = new LidlProvider();
    const data = await provider.fetch("SK", "Bratislava");

    expect(data.store).toEqual({ id: "lidl", label: "Lidl", dotColor: "#2563eb" });
    expect(data.categories).toEqual([{ id: "dairy-eggs", name: "Dairy & Eggs", count: 1 }]);
    expect(data.offers).toHaveLength(1);
    expect(data.offers[0]).toMatchObject({
      id: "off-1",
      title: "Milk",
      categoryId: "dairy-eggs",
      regularPrice: 1.29,
      discountedPrice: 0.99,
      validUntil: "2026-09-22T00:00:00.000Z",
    });
    expect(data.offers[0].discountPercent).toBe(23);
  });

  it("returns empty DashboardData when no store matches the city", async () => {
    mockFetchSequence(
      { ok: true, json: async () => [] },
      { ok: true, json: async () => [] },
    );

    const provider = new LidlProvider();
    const data = await provider.fetch("SK", "Nowhereville");

    expect(data).toEqual({
      store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" },
      categories: [],
      offers: [],
    });
  });
});

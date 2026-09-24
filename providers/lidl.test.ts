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

  it("derives a deterministic id for offers with no id from the API, stable across refetches", async () => {
    const rawOfferNoId = {
      title: "Yogurt",
      brand: "Andros",
      category: "Dairy & Eggs",
      startValidityDate: "2026-09-15T00:00:00.000Z",
      endValidityDate: "2026-09-22T00:00:00.000Z",
      packaging: "500 g",
      priceBox: {
        largePartNumeric: 0.79,
        smallPartNumeric: 0.99,
      },
    };
    const offersResponseNoId = { totalOffers: 1, offers: [rawOfferNoId] };

    mockFetchSequence(
      { ok: true, json: async () => storeSearchResponse },
      { ok: true, json: async () => offersResponseNoId },
    );
    const data1 = await new LidlProvider().fetch("SK", "Bratislava");

    mockFetchSequence(
      { ok: true, json: async () => storeSearchResponse },
      { ok: true, json: async () => offersResponseNoId },
    );
    const data2 = await new LidlProvider().fetch("SK", "Bratislava");

    expect(data1.offers[0].id).toBeTruthy();
    expect(data1.offers[0].id).toBe(data2.offers[0].id);
  });

  it("derives different ids for offers with no id that differ in stable fields", async () => {
    const rawOfferA = {
      title: "Yogurt",
      category: "Dairy & Eggs",
      startValidityDate: "2026-09-15T00:00:00.000Z",
      endValidityDate: "2026-09-22T00:00:00.000Z",
      priceBox: { largePartNumeric: 0.79, smallPartNumeric: 0.99 },
    };
    const rawOfferB = {
      title: "Kefir",
      category: "Dairy & Eggs",
      startValidityDate: "2026-09-15T00:00:00.000Z",
      endValidityDate: "2026-09-22T00:00:00.000Z",
      priceBox: { largePartNumeric: 1.19, smallPartNumeric: 1.49 },
    };

    mockFetchSequence(
      { ok: true, json: async () => storeSearchResponse },
      { ok: true, json: async () => ({ totalOffers: 2, offers: [rawOfferA, rawOfferB] }) },
    );
    const data = await new LidlProvider().fetch("SK", "Bratislava");

    expect(data.offers[0].id).not.toBe(data.offers[1].id);
  });

  it("hides 0.00-price special offers (e.g. 3+1) from the result", async () => {
    const specialOffer = {
      id: "off-special",
      title: "Pivo 3+1",
      category: "Dairy & Eggs",
      startValidityDate: "2026-09-15T00:00:00.000Z",
      endValidityDate: "2026-09-22T00:00:00.000Z",
      priceBox: { largePartNumeric: 0 },
    };

    mockFetchSequence(
      { ok: true, json: async () => storeSearchResponse },
      {
        ok: true,
        json: async () => ({ totalOffers: 2, offers: [...offersResponse.offers, specialOffer] }),
      },
    );
    const data = await new LidlProvider().fetch("SK", "Bratislava");

    expect(data.offers.map((o) => o.id)).toEqual(["off-1"]);
    expect(data.categories).toEqual([{ id: "dairy-eggs", name: "Dairy & Eggs", count: 1 }]);
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

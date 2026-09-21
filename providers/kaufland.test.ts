import { afterEach, describe, expect, it, vi } from "vitest";
import { KauflandProvider } from "./kaufland";

const storeListResponse = [
  {
    n: "SK0042",
    cn: "Kaufland Bratislava",
    t: "Bratislava",
    sn: "Hlavna 1",
    pc: "81101",
    lat: "48.1486",
    lng: "17.1077",
  },
];

function offersHtml(props: unknown): string {
  return `<script>window.SSR['abc'] = ${JSON.stringify({
    component: "OfferTemplate",
    props,
  })}</script>`;
}

const offerTemplateProps = {
  weekData: { currentWeekDates: ["2026-09-15", "2026-09-21"], nextWeekDates: [] },
  offerData: {
    cycles: [
      {
        categories: [
          {
            offerCategoryId: "cat-1",
            displayName: "Bakery",
            offers: [
              {
                offerId: "o1",
                klNr: "123",
                title: "Bread",
                subtitle: "Fresh",
                unit: "1 pc",
                price: 1.5,
                formattedOldPrice: "2,00",
                discount: 25,
                dateFrom: "2026-09-15T00:00:00.000Z",
                dateTo: "2026-09-22T00:00:00.000Z",
              },
            ],
          },
        ],
      },
    ],
  },
};

function mockFetchSequence(...responses: Array<{ ok: boolean; text: () => Promise<string> }>) {
  const impl = vi.fn();
  for (const response of responses) impl.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", impl);
  return impl;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("KauflandProvider", () => {
  it("fetches a store then its offers and normalizes to DashboardData", async () => {
    mockFetchSequence(
      { ok: true, text: async () => JSON.stringify(storeListResponse) },
      { ok: true, text: async () => offersHtml(offerTemplateProps) },
    );

    const provider = new KauflandProvider();
    const data = await provider.fetch("SK", "Bratislava");

    expect(data.store).toEqual({ id: "kaufland", label: "Kaufland", dotColor: "#dc2626" });
    expect(data.categories).toEqual([{ id: "cat-1", name: "Bakery", count: 1 }]);
    expect(data.offers).toHaveLength(1);
    expect(data.offers[0]).toMatchObject({
      id: "o1",
      title: "Bread",
      subtitle: "Fresh",
      categoryId: "cat-1",
      regularPrice: 2,
      discountedPrice: 1.5,
      discountPercent: 25,
      validUntil: "2026-09-22T00:00:00.000Z",
    });
    expect(data.offers[0].daysLeft).toBeGreaterThanOrEqual(0);
    expect(data.offers[0].ringPercent).toBeGreaterThanOrEqual(0);
  });

  it("returns empty DashboardData when no store matches the city", async () => {
    mockFetchSequence({ ok: true, text: async () => JSON.stringify([]) });

    const provider = new KauflandProvider();
    const data = await provider.fetch("SK", "Nowhereville");

    expect(data).toEqual({
      store: { id: "kaufland", label: "Kaufland", dotColor: "#dc2626" },
      categories: [],
      offers: [],
    });
  });

  it("picks the first match when multiple stores match the city", async () => {
    mockFetchSequence(
      {
        ok: true,
        text: async () =>
          JSON.stringify([
            storeListResponse[0],
            { ...storeListResponse[0], n: "SK0099", cn: "Kaufland Bratislava 2" },
          ]),
      },
      { ok: true, text: async () => offersHtml(offerTemplateProps) },
    );

    const provider = new KauflandProvider();
    const data = await provider.fetch("SK", "Bratislava");

    expect(data.offers).toHaveLength(1);
  });
});

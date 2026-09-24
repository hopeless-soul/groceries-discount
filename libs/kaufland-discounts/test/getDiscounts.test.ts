import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDiscountsResponse, extractOfferTemplate, fetchDiscounts } from "../dist/getDiscounts.js";
import { UpstreamError, ValidationError } from "../dist/errors.js";

const SAMPLE_PROPS = {
  weekData: { currentWeekDates: ["2026-09-21"], nextWeekDates: [] },
  offerData: {
    cycles: [
      {
        categories: [
          {
            offerCategoryId: "SK3920_20260831000000_01a",
            displayName: "Ovocie",
            dateFrom: "2026-08-31",
            dateTo: "2026-09-06",
            main: true,
            order: "1",
            offers: [
              {
                offerId: "20260831000000.00138945.SK.3920.0000018346",
                klNr: "00138945",
                title: "Avokádo",
                subtitle: "500 g balenie",
                unit: "500 g balenie",
                price: 2.19,
                formattedOldPrice: "2,99",
                discount: 26,
                basePrice: "(=1 kg 4,38)",
                dateFrom: "2026-08-31",
                dateTo: "2026-09-06",
                label: "reducedPrice",
                loyaltyDiscount: 0,
                listImage: "https://kaufland.media.schwarz/is/image/schwarz/00138945_P",
              },
            ],
          },
        ],
      },
    ],
  },
};

function offerTemplateHtml(uuid: string, payload: unknown): string {
  return `<script>window.SSR = window.SSR || {}; window.SSR['${uuid}'] = ${JSON.stringify(payload)};</script>`;
}

test("buildDiscountsResponse maps raw offers/categories to the documented shape", () => {
  const result = buildDiscountsResponse("SK3920", SAMPLE_PROPS);
  assert.equal(result.store_code, "SK3920");
  assert.equal(result.category_count, 1);
  assert.equal(result.offer_count, 1);
  assert.equal(result.categories[0]?.category_name, "Ovocie");
  const offer = result.offers[0]!;
  assert.equal(offer.old_price, 2.99);
  assert.equal(offer.currency, "EUR");
  assert.equal(offer.category_id, "SK3920_20260831000000_01a");
  assert.match(result.fetched_at, /^\d{4}-\d{2}-\d{2}T/);
});

function propsWithOffer(offer: Record<string, unknown>) {
  return { offerData: { cycles: [{ categories: [{ offerCategoryId: "c1", displayName: "Zelenina", offers: [offer] }] }] } };
}

test("buildDiscountsResponse prefers the Kaufland Card (Xtra) price over the everyone price", () => {
  const result = buildDiscountsResponse(
    "SK1830",
    propsWithOffer({
      offerId: "o1",
      title: "Petržlen",
      price: 1.19,
      formattedPrice: "1,19",
      formattedOldPrice: "1,69",
      discount: 29,
      basePrice: "(=1 kg 3,97)",
      label: "reducedPrice",
      loyaltyDiscount: 41,
      loyaltyFormattedPrice: "0,99",
      loyaltyFormattedOldPrice: "1,69",
      loyaltyBasePrice: "(=1 kg 3,30)",
    }),
  );
  const offer = result.offers[0]!;
  assert.equal(offer.price, 0.99);
  assert.equal(offer.old_price, 1.69);
  assert.equal(offer.discount_percent, 41);
  assert.equal(offer.base_price_text, "(=1 kg 3,30)");
  assert.equal(offer.loyalty_discount, 41);
});

test("buildDiscountsResponse takes the regular price from the Xtra tier when there is no everyone discount", () => {
  const result = buildDiscountsResponse(
    "SK1830",
    propsWithOffer({
      offerId: "o2",
      title: "Ščipák humenský",
      price: 4.99,
      formattedPrice: "4,99",
      basePrice: "(=1 kg 10,62)",
      label: "none",
      loyaltyDiscount: 24,
      loyaltyFormattedPrice: "3,79",
      loyaltyFormattedOldPrice: "4,99",
    }),
  );
  const offer = result.offers[0]!;
  assert.equal(offer.price, 3.79);
  assert.equal(offer.old_price, 4.99);
  assert.equal(offer.discount_percent, 24);
  assert.equal(offer.base_price_text, "(=1 kg 10,62)");
});

test("buildDiscountsResponse keeps the everyone price when there is no Xtra tier", () => {
  const offer = buildDiscountsResponse("SK3920", SAMPLE_PROPS).offers[0]!;
  assert.equal(offer.price, 2.19);
  assert.equal(offer.discount_percent, 26);
  assert.equal(offer.base_price_text, "(=1 kg 4,38)");
});

test("buildDiscountsResponse falls back to EUR for an unmapped country prefix", () => {
  const result = buildDiscountsResponse("XX0001", { offerData: { cycles: [] } });
  assert.equal(result.offer_count, 0);
  assert.deepEqual(result.categories, []);
});

test("extractOfferTemplate finds the OfferTemplate block, skipping over unrelated window.SSR entries and nested braces", () => {
  const decoy = `window.SSR['aaa'] = {"component":"SomethingElse","props":{"x":{"y":1}}};`;
  const real = `window.SSR['bbb'] = ${JSON.stringify({ component: "OfferTemplate", props: SAMPLE_PROPS })};`;
  const html = `<script>${decoy} ${real}</script>`;
  const template = extractOfferTemplate(html);
  assert.equal(template.component, "OfferTemplate");
  assert.equal(template.props?.weekData?.currentWeekDates?.[0], "2026-09-21");
});

test("extractOfferTemplate throws UpstreamError when no OfferTemplate block is present", () => {
  assert.throws(() => extractOfferTemplate("<html>no ssr here</html>"), UpstreamError);
});

test("fetchDiscounts validates the store code before making any request", async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return new Response("");
  }) as unknown as typeof fetch;
  await assert.rejects(() => fetchDiscounts("not-a-code", { fetchImpl }), ValidationError);
  assert.equal(called, false);
});

test("fetchDiscounts fetches, extracts, and normalizes a full response", async () => {
  const html = offerTemplateHtml("uuid-1", { component: "OfferTemplate", props: SAMPLE_PROPS });
  let sentCookie: string | undefined;
  const fetchImpl = (async (_url: string, init?: RequestInit) => {
    sentCookie = (init?.headers as Record<string, string>)?.["Cookie"];
    return new Response(html);
  }) as unknown as typeof fetch;

  const result = await fetchDiscounts("sk3920", { fetchImpl });
  assert.equal(sentCookie, "x-aem-variant=SK3920");
  assert.equal(result.store_code, "SK3920");
  assert.equal(result.offer_count, 1);
});

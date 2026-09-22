import { test } from "node:test";
import assert from "node:assert/strict";
import { lookupDiscounts } from "../dist/index.js";
import { AmbiguousStoreError, NoStoreFoundError, ValidationError } from "../dist/errors.js";

const STORE_A = {
  n: "SK1420",
  cn: "Kaufland A",
  t: "Bratislava",
  sn: "Street 1",
  pc: "851 01",
  lat: "48.14",
  lng: "17.10",
  wod: [],
  friendlyUrl: "a",
};
const STORE_B = {
  n: "SK1421",
  cn: "Kaufland B",
  t: "Bratislava",
  sn: "Street 2",
  pc: "821 01",
  lat: "48.16",
  lng: "17.15",
  wod: [],
  friendlyUrl: "b",
};

function offerHtml(storeCode: string): string {
  const payload = {
    component: "OfferTemplate",
    props: { weekData: {}, offerData: { cycles: [] } },
  };
  return `<script>window.SSR['x'] = ${JSON.stringify(payload)};</script><!-- ${storeCode} -->`;
}

function makeFetch(storeList: unknown[]) {
  return (async (url: string) => {
    if (url.includes("klstorefinder")) {
      return new Response(JSON.stringify(storeList));
    }
    return new Response(offerHtml("x"));
  }) as unknown as typeof fetch;
}

test("lookupDiscounts throws NoStoreFoundError when the city matches nothing", async () => {
  await assert.rejects(
    () => lookupDiscounts("Nowhere", { fetchImpl: makeFetch([STORE_A]) }),
    NoStoreFoundError,
  );
});

test("lookupDiscounts throws AmbiguousStoreError with candidates when multiple stores match", async () => {
  try {
    await lookupDiscounts("Bratislava", { fetchImpl: makeFetch([STORE_A, STORE_B]) });
    assert.fail("expected AmbiguousStoreError");
  } catch (err) {
    assert.ok(err instanceof AmbiguousStoreError);
    assert.equal(err.stores.length, 2);
  }
});

test("lookupDiscounts resolves a single match end-to-end and attaches the store", async () => {
  const result = await lookupDiscounts("Bratislava", { fetchImpl: makeFetch([STORE_A]) });
  assert.equal(result.store?.store_code, "SK1420");
  assert.equal(result.store_code, "SK1420");
});

test("lookupDiscounts uses storeIndex to disambiguate", async () => {
  const result = await lookupDiscounts("Bratislava", {
    storeIndex: 1,
    fetchImpl: makeFetch([STORE_A, STORE_B]),
  });
  assert.equal(result.store?.store_code, "SK1421");
});

test("lookupDiscounts rejects an out-of-range storeIndex", async () => {
  await assert.rejects(
    () => lookupDiscounts("Bratislava", { storeIndex: 5, fetchImpl: makeFetch([STORE_A, STORE_B]) }),
    ValidationError,
  );
});

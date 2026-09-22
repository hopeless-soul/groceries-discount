import { test } from "node:test";
import assert from "node:assert/strict";
import { findStores } from "../dist/findStore.js";

const RAW_STORES = [
  {
    n: "SK3920",
    cn: "Kaufland Dubnica nad Vahom",
    t: "Dubnica n/Váhom",
    sn: "Továrenská ulica 4202/75",
    pc: "018 41",
    p: "0800/152835",
    lat: "48.962945",
    lng: "18.1796804",
    wod: ["Monday|07:00|21:00"],
    opd: "2008-12-04T00:00:00.000Z",
    eod: "",
    friendlyUrl: "dubnica-nad-vahom-3920",
    slf: "BakingFresh,GourmetFood",
  },
  {
    n: "SK1420",
    cn: "Kaufland Bratislava Petrzalka",
    t: "Bratislava",
    sn: "Some street 1",
    pc: "851 01",
    lat: "48.14",
    lng: "17.10",
    wod: [],
    friendlyUrl: "bratislava-1420",
  },
  {
    n: "SK1421",
    cn: "Kaufland Bratislava Ruzinov",
    t: "Bratislava",
    sn: "Some street 2",
    pc: "821 01",
    lat: "48.16",
    lng: "17.15",
    wod: [],
    friendlyUrl: "bratislava-1421",
  },
];

function fetchImplFor(body: unknown) {
  return (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;
}

test("findStores matches by substring, case- and diacritic-insensitively", async () => {
  const results = await findStores("SK", "dubnica", { fetchImpl: fetchImplFor(RAW_STORES) });
  assert.equal(results.length, 1);
  assert.equal(results[0]?.store_code, "SK3920");
  assert.equal(results[0]?.country_code, "SK");
  assert.equal(results[0]?.store_number, "3920");
  assert.equal(results[0]?.latitude, 48.962945);
  assert.deepEqual(results[0]?.opening_hours, [{ day: "Monday", open: "07:00", close: "21:00" }]);
  assert.equal(results[0]?.opened_date, "2008-12-04");
  assert.equal(results[0]?.closed_date, null);
  assert.deepEqual(results[0]?.services, ["BakingFresh", "GourmetFood"]);
});

test("findStores sorts exact city matches first, then alphabetically", async () => {
  const results = await findStores("SK", "Bratislava", { fetchImpl: fetchImplFor(RAW_STORES) });
  assert.deepEqual(
    results.map((s) => s.store_code),
    ["SK1420", "SK1421"],
  );
});

test("findStores exact:true requires a full normalized match", async () => {
  const partial = await findStores("SK", "Bratisl", {
    exact: true,
    fetchImpl: fetchImplFor(RAW_STORES),
  });
  assert.equal(partial.length, 0);

  const exact = await findStores("SK", "bratislava", {
    exact: true,
    fetchImpl: fetchImplFor(RAW_STORES),
  });
  assert.equal(exact.length, 2);
});

test("findStores returns an empty array for no matches", async () => {
  const results = await findStores("SK", "Nowhereville", { fetchImpl: fetchImplFor(RAW_STORES) });
  assert.deepEqual(results, []);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { getDomain, httpGet, slugify } from "../dist/common.js";
import { UnsupportedCountryError, UpstreamError } from "../dist/errors.js";

test("getDomain returns the known SK domain", () => {
  assert.equal(getDomain("SK"), "predajne.kaufland.sk");
});

test("getDomain throws UnsupportedCountryError for unknown countries", () => {
  assert.throws(() => getDomain("XX"), UnsupportedCountryError);
});

test("slugify strips diacritics, lowercases, and hyphenates", () => {
  assert.equal(slugify("Dubnica n/Váhom"), "dubnica-n-vahom");
  assert.equal(slugify(""), "unknown");
  assert.equal(slugify(null), "unknown");
});

test("httpGet returns the response body on success", async () => {
  const fetchImpl = (async () =>
    new Response("ok body", { status: 200 })) as unknown as typeof fetch;
  const body = await httpGet("https://example.invalid/x", { fetchImpl });
  assert.equal(body, "ok body");
});

test("httpGet wraps a non-2xx status in UpstreamError", async () => {
  const fetchImpl = (async () =>
    new Response("nope", { status: 500, statusText: "Internal Server Error" })) as unknown as typeof fetch;
  await assert.rejects(() => httpGet("https://example.invalid/x", { fetchImpl }), UpstreamError);
});

test("httpGet wraps a network failure in UpstreamError", async () => {
  const fetchImpl = (async () => {
    throw new TypeError("network down");
  }) as unknown as typeof fetch;
  await assert.rejects(() => httpGet("https://example.invalid/x", { fetchImpl }), UpstreamError);
});

test("httpGet sends cookies as a Cookie header", async () => {
  let seenHeaders: Record<string, string> | undefined;
  const fetchImpl = (async (_url: string, init?: RequestInit) => {
    seenHeaders = init?.headers as Record<string, string>;
    return new Response("ok");
  }) as unknown as typeof fetch;
  await httpGet("https://example.invalid/x", { fetchImpl, cookies: { a: "1", b: "2" } });
  assert.equal(seenHeaders?.["Cookie"], "a=1; b=2");
});

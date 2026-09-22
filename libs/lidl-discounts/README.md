# lidl-discounts (TypeScript port)

Unofficial TypeScript client for the public Lidl Plus store & offers
endpoints. This is a port of the [Python client](../main.py) in this repo,
built for use in web apps (browser or server-side JS/TS).

Every method either **resolves with plain, schema-validated JSON data**, or
**rejects (throws) with an error** — there is no other outcome. See
[Error handling](#error-handling).

## Install

From within this `ts/` folder:

```bash
npm install
npm run build
```

This produces `dist/` (ESM + `.d.ts` declarations), which is what
`package.json`'s `main`/`types`/`exports` point at. To use it from another
project, either `npm install` this folder as a local/linked dependency, or
copy `src/` into your app and let your own bundler compile it.

The only runtime dependency is [`zod`](https://zod.dev) (^3.23), used for
response validation.

## ⚠️ Browser usage caveats

This client uses the standard `fetch` API, so it runs in any modern browser,
Node 18+, Deno, Bun, or edge runtimes. Two things are specific to running it
**directly from a browser tab**, though:

1. **CORS.** The Lidl Plus endpoints (`stores.lidlplus.com`,
   `offers.lidlplus.com`) are not verified to send
   `Access-Control-Allow-Origin` headers for arbitrary web origins. If a
   direct browser request is blocked by CORS, proxy it through your own
   backend/edge function and call that instead.
2. **`User-Agent` is a forbidden header.** Browsers silently ignore attempts
   to set `User-Agent` via `fetch()` (it's on the forbidden header list).
   The client still sends it for Node/server environments; in a browser the
   API will just see the browser's own `User-Agent` string instead. This
   doesn't break requests, but if Lidl ever starts gating on it, browser
   requests could behave differently than server requests.

Server-side usage (Node, Next.js route handlers, Cloudflare/Vercel edge
functions, etc.) is unaffected by either point.

## Quick start

```ts
import { LidlPlus } from "lidl-discounts";

const lidl = new LidlPlus({ country: "DE" });

try {
  const { store, offers } = await lidl.offersForStoreSearch("Hamburg");
  console.log(store.name, offers.totalOffers);
} catch (err) {
  // err is a LidlAPIError or LidlStoreNotFoundError (see below)
  console.error(err);
}
```

## API

### `new LidlPlus(options?)`

| Option          | Type     | Default                          | Notes                                             |
| ---------------- | -------- | --------------------------------- | -------------------------------------------------- |
| `country`         | `string` | `"DE"`                             | Upper-cased; falls back to `DE` defaults if unknown |
| `language`        | `string` | per-country default (see below)   | e.g. `"de-DE"`                                      |
| `latitude`        | `number` | per-country default               | Used to rank/bias autocomplete results              |
| `longitude`       | `number` | per-country default               | Used to rank/bias autocomplete results              |
| `timeout`         | `number` | `20000`                            | Request timeout in **milliseconds** (Python client used seconds) |
| `storesBaseUrl`    | `string` | `https://stores.lidlplus.com/api/` |                                                      |
| `offersBaseUrl`    | `string` | `https://offers.lidlplus.com/app/api/` |                                                  |
| `appVersion`       | `string` | `"17.0.5"`                          | Sent as `X-Client-Version` / part of `User-Agent`   |

There is no `.env` / environment-variable config in this port (browsers
don't reliably have `process.env`) — pass everything explicitly via the
constructor options.

### `COUNTRY_DEFAULTS`

Built-in language/coordinate defaults, keyed by ISO country code:
`DE`, `AT`, `ES`, `FR`, `NL`, `PL`, `SK`. Unknown country codes fall back to
`DE`'s defaults.

### Methods (all async, all return JSON or throw)

| Method | Returns | Description |
| --- | --- | --- |
| `stores()` | `Promise<StoreData[]>` | All stores in `country`. |
| `searchStores(query, limit = 10)` | `Promise<StoreData[]>` | Lidl Plus autocomplete search, ranked; falls back to `searchStoresFromCatalog` if autocomplete returns nothing. |
| `searchStoresFromCatalog(query, limit = 10)` | `Promise<StoreData[]>` | Substring search over `stores()`, ranked. |
| `findStore(query)` | `Promise<StoreData>` | Best single match. Throws `LidlStoreNotFoundError` if there's no match or the match has no `storeKey`. |
| `offers(storeKey)` | `Promise<OffersResponseData>` | Current offers for a store. |
| `offersForStoreSearch(query)` | `Promise<{ store: StoreData; offers: OffersResponseData }>` | `findStore` + `offers` combined. |

## Data schemas

Response bodies are validated at runtime with [zod](https://zod.dev)
schemas exported from `src/types.ts`. These schemas **are** the
documentation of the wire format — they're also directly importable if you
want to validate/parse Lidl responses yourself, or derive JSON Schema from
them (e.g. via [`zod-to-json-schema`](https://github.com/StefanTerdell/zod-to-json-schema)).

All object schemas use `.passthrough()`, mirroring the Python client's
`extra="allow"`: unknown fields from the API are kept, not stripped, and
nothing here fabricates fields the API didn't send.

### `Store` (`StoreSchema`, `StoreData`)

```ts
{
  storeKey: string | null;      // e.g. "DE5868"
  name: string | null;
  address: string | null;
  postalCode: string | null;
  locality: string | null;
  distance: number | null;      // meters, when returned by autocomplete
  location: {
    latitude: number | null;
    longitude: number | null;
  } | null;
  // + any additional fields the API returns
}
```

### `Offer` (`OfferSchema`, `OfferData`)

```ts
{
  id: string | null;
  title: string | null;
  brand: string | null;
  category: string | null;
  offerType: string | null;
  imageUrl: string | null;
  startValidityDate: string | null;   // ISO-ish date string
  endValidityDate: string | null;
  priceBox: PriceBox | null;
  packaging: string | null;
  pricePerUnit: string | null;
  // + any additional fields the API returns
}
```

### `PriceBox` (`PriceBoxSchema`, `PriceBoxData`)

```ts
{
  priceSymbol: string | null;         // e.g. "€"
  discountMessage: string | null;     // e.g. "-49%" or "2+1" (may include footnote markers)
  largePartNumeric: number | null;    // current price, numeric
  largePartString: string | null;     // current price, pre-formatted (takes precedence if present)
  smallPartNumeric: number | null;    // old/regular price, numeric
  smallPartString: string | null;     // old/regular price, pre-formatted
}
```

### `OffersResponse` (`OffersResponseSchema`, `OffersResponseData`)

```ts
{
  offers: Offer[];              // defaults to [] if missing
  totalOffers: number | null;
}
```

## Display formatting helpers

The Python models exposed computed properties like `Store.label` or
`Offer.price`. Since this port's core API must stay pure JSON, those became
plain, side-effect-free functions in `src/format.ts` that you call
explicitly when you want to render something:

| Function | Equivalent to (Python) |
| --- | --- |
| `getStoreLabel(store)` | `Store.label` |
| `getStoreTitle(store)` | `Store.title` |
| `getOfferLabel(offer)` | `Offer.label` |
| `getOfferPeriod(offer)` | `Offer.period` |
| `getOfferPrice(offer)` | `Offer.price` |
| `getOfferOldPrice(offer)` | `Offer.old_price` |
| `getOfferDiscount(offer)` | `Offer.discount` |
| `formatDate(value)` | `_format_date` |
| `formatPrice(numeric, text, symbol)` | `_format_price` |
| `stripFootnoteMarkers(value)` | `_strip_footnote_markers` |
| `offerName(brand, title, fallback)` | `_offer_name` |

None of these throw or do I/O — they take already-fetched data and return a
`string`.

## Error handling

Two error classes, both exported from the package root:

- **`LidlAPIError`** — network failures, non-2xx HTTP responses, invalid
  JSON, or a response that fails schema validation. `error.cause` holds the
  underlying `Error`/`ZodError` when available.
- **`LidlStoreNotFoundError`** *(extends `LidlAPIError`)* — thrown by
  `findStore()` / `offersForStoreSearch()` when no store matches the query,
  or the matched store has no `storeKey`.

```ts
import { LidlAPIError, LidlStoreNotFoundError } from "lidl-discounts";

try {
  await lidl.offersForStoreSearch("nonexistent place");
} catch (err) {
  if (err instanceof LidlStoreNotFoundError) {
    // no matching store
  } else if (err instanceof LidlAPIError) {
    // network / HTTP / schema-validation failure
  } else {
    throw err; // truly unexpected
  }
}
```

## Differences from the Python client

- **No CLI.** The Python `main.py` argparse CLI and its table-printing
  functions (`print_store`, `print_offers`) aren't ported — this package is
  a library only, meant to be consumed by a web app's own UI.
- **No `.env` config.** Settings are passed explicitly to the `LidlPlus`
  constructor instead of read from environment variables.
- **`timeout` is in milliseconds**, not seconds.
- **Computed model properties became plain functions** (see
  [Display formatting helpers](#display-formatting-helpers)) so the core
  client API stays strictly "returns JSON or throws."
- **Validation is `zod` instead of `pydantic`**, with the same
  `extra="allow"` / passthrough behavior for unknown fields.

## Verified

`npm run build` (via `tsc --strict`) and a live smoke test against
`offersForStoreSearch("Hamburg")` (success path returning parsed JSON) and
`findStore("<garbage query>")` (failure path throwing
`LidlStoreNotFoundError`) both passed during development of this port.

# Discount Locator App — Design

Source material: `specs/specs.txt`, `specs/design spec.md` (+ `Main.dc.html`,
`Dashboard.dc.html` as visual/CSS reference), and the two provided fetch
scripts (`scripts/lidl/ts`, `scripts/kaufland/ts`).

## Overview

A desktop web app (Next.js 16 App Router, React 19, TypeScript, Tailwind v4)
that lets a user pick a Country/City once, then browse current grocery
discounts across a fixed set of stores (Lidl, Kaufland, Billa, Tesco),
filter by category, and build a cart of offers they want to buy — all
without a backend database. Country/City and cart contents persist to
`localStorage`; everything else is session state.

Visual design (colors, spacing, radii, typography) is fully specified in
`specs/design spec.md` and is treated as final/exact — this document covers
architecture, data flow, and behavior, not restated visual tokens.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 — already
  scaffolded.
- **shadcn/ui** for accessible primitives (Select, Button, Card, Badge),
  themed to the spec's zinc/Inter tokens.
- **Zustand** (with `persist` middleware) for state.
- The two provided vendor packages, wired in as local `file:` dependencies
  (see below).

## Project structure

```
app/
  page.tsx                    location-select screen
  dashboard/page.tsx          dashboard screen
lib/
  types.ts                    DashboardData/Offer/Category/Store types
  locations.ts                Country -> City seed data (extensible)
  validity.ts                 ringPercent/daysLeft/urgency-color math
  fetchDashboardData.ts       'use server' unified fetch function
  stores/
    location-store.ts         zustand, persisted (country, city)
    cart-store.ts             zustand, persisted (cart items)
    dashboard-ui-store.ts     zustand, not persisted (selectedStore, activeCategory, cartOpen)
providers/
  types.ts                    GroceryProvider interface, StoreName enum
  registry.ts                 StoreName -> provider instance map
  lidl.ts                     real, via lidl-discounts
  kaufland.ts                 real, via kaufland-discounts
  billa.ts  tesco.ts          stubs (no script provided yet)
components/
  ui/...                      shadcn-generated primitives
  location/LocationSelectCard.tsx
  layout/AppHeader.tsx
  dashboard/StoreList.tsx  CategoryList.tsx
  dashboard/OfferGrid.tsx  OfferCard.tsx  ValidityRing.tsx
  dashboard/CartPanel.tsx  CartItemRow.tsx
```

Layout components (`AppHeader`, the 3-pane dashboard grid, `CartPanel`) keep
sizing/layout logic isolated in their own files so a future mobile design
pass can change layout behavior without touching card/row internals —
desktop-only (1280–1440px) is what's being built now, per the design spec.

## Data layer

### Target shape (`lib/types.ts`)

Implements the `DashboardData` JSON Schema from `specs/specs.txt`, with two
fixes to that schema's own inconsistencies: `daysLeft` (integer) and
`ringPercent` (0–100) are added to the `Offer` properties (they were listed
as `required` but never defined), and the trailing comma after `validUntil`
is dropped. `store.dotColor` is always from static config, never the API.

### `GroceryProvider` (`providers/types.ts`)

```ts
enum StoreName {
  Lidl = 'lidl',
  Kaufland = 'kaufland',
  Billa = 'billa',
  Tesco = 'tesco',
}

interface GroceryProvider {
  name: StoreName;
  label: string;
  dotColor: string;
  fetch(country: string, city: string): Promise<DashboardData>;
}
```

Each store is a class implementing this interface. `fetch` is the only
public method; each class has a `private normalize(raw): DashboardData`
that `fetch` calls internally after getting raw data. `StoreName` is the
canonical store-identity type used for the provider registry keys,
`dashboard-ui-store.selectedStore`, and the unified fetch function's
signature. `DashboardData.store.id` stays a plain `string` (the fixed
external schema contract), populated with the enum's string value.

### Real providers: Lidl, Kaufland

Both vendor packages (`scripts/lidl/ts`, `scripts/kaufland/ts`) must run
**server-side only**:

- Kaufland scrapes an HTML page and sets a `Cookie` header — browsers block
  `fetch()` from setting `Cookie`.
- Lidl's own README flags its endpoints as unverified for browser CORS, and
  silently drops the `User-Agent` header it tries to set in-browser.

So `lib/fetchDashboardData.ts` — the "unified fetch function" from
specs.txt — is a **Server Action** (`'use server'`):

```ts
'use server';
export async function fetchDashboardData(
  name: StoreName, country: string, city: string
): Promise<DashboardData> {
  return groceryProviders[name].fetch(country, city);
}
```

Client components call this directly like a normal async function; Next
runs its body on the server.

**`providers/lidl.ts`** — `fetch()` builds `new LidlPlus({ country })`,
calls `offersForStoreSearch(city)`, then normalizes `{ store, offers }`:
categories are derived by grouping `offer.category` (slugified — Lidl
offers carry no stable category id, unlike Kaufland's `category_id`);
`regularPrice`/`discountedPrice` come from `priceBox.smallPartNumeric` /
`largePartNumeric`; `discountPercent` is computed from those numbers, not
parsed from `discountMessage` text; `validUntil`/ring math come from
`startValidityDate`/`endValidityDate`. `LidlStoreNotFoundError` is caught
and produces an empty `DashboardData` (empty-state store, not a crash);
other `LidlAPIError`s propagate so the UI can surface a real error.

**`providers/kaufland.ts`** — `fetch()` calls `lookupDiscounts(city, {
country })`. `AmbiguousStoreError` is caught and retried once with
`storeIndex: 0` (no store-picker UI exists, so the first/closest match is
taken silently). `NoStoreFoundError` → empty `DashboardData`. Categories
and offers map closely 1:1 from `DiscountsResponse` — `category_id`,
`category_name`, `offer_count`, and per-offer `valid_from`/`valid_to` feed
the ring math directly (no synthetic weekly-cycle needed; real data already
carries validity dates).

**Known real-world constraint:** Kaufland's `COUNTRY_DOMAINS` map currently
only has `SK`; any other country throws `UnsupportedCountryError`. Lidl
supports `DE, AT, ES, FR, NL, PL, SK`. The location-select country list
(below) is scoped to `SK` only for now to stay within both.

### Stub providers: Billa, Tesco

No vendor script provided yet. `fetch()` resolves immediately to
`{ store: { id, label, dotColor }, categories: [], offers: [] }` — still
selectable in the UI (left rail shows all 4 stores), just always empty.

### Package wiring

```json
"lidl-discounts": "file:../scripts/lidl/ts",
"kaufland-discounts": "file:../scripts/kaufland/ts"
```
Kaufland already has a built `dist/`; Lidl needs `npm install && npm run
build` run once inside `scripts/lidl/ts` before the app's own `npm install`
can link it.

### `lib/locations.ts`

An array of `{ name: string; code: string; cities: string[] }`, seeded with
just Slovakia today (real city names Kaufland/Lidl store lookups can
resolve). Structured so adding Poland/Austria (both Lidl-supported) later
is just another array entry.

### `lib/validity.ts`

Shared math so every provider's `normalize` (and the UI) compute
`ringPercent`/`daysLeft`/urgency color the same way:
- `computeRingPercent(validFrom, validUntil, now)`
- `computeDaysLeft(validUntil, now)`
- `getUrgencyColor(daysLeft)` → `#18181b` / `#d97706` (≤3d) / `#dc2626`
  (≤1d) — reused by both `ValidityRing` and `CartItemRow`'s "Valid until"
  text so urgency coloring can't drift between the two places.

## Screens

### `app/page.tsx` — location select (Client Component)

On mount, reads `useLocationStore`; if `country`/`city` are already saved,
`router.replace('/dashboard')` immediately. Otherwise renders
`LocationSelectCard`: brand mark, Country `Select` (seeded from
`lib/locations.ts`), City `Select` (disabled until a country is picked),
`Continue` button (disabled until both are set). On submit: writes to
`useLocationStore` (persists) and navigates to `/dashboard`.

### `app/dashboard/page.tsx` — dashboard (Client Component)

Guards the inverse case: no saved country/city → `router.replace('/')`.
Renders the 3-pane layout:

- **`AppHeader`** — brand mark, current date, cart toggle (badge count from
  `useCartStore`, hidden when empty) toggling `dashboard-ui-store.cartOpen`.
- **`StoreList`** — all 4 `groceryProviders` entries; selecting one sets
  `selectedStore` and resets `activeCategory` to `'All'`.
- **`CategoryList`** — derived from the current fetch's `categories` (plus
  a synthetic `All` row with the total offer count).
- **`OfferGrid`** — a `useDashboardData(selectedStore)` hook calls the
  `fetchDashboardData` server action, keyed off `selectedStore` +
  `useLocationStore`'s country/city; manages loading/error/data state,
  refetches on store change. Filters `data.offers` by `activeCategory`,
  renders `OfferCard`s in the 3-column grid. Three states: loading
  (skeleton), error (inline message + retry — added beyond the original
  design since real network calls can genuinely fail), empty (zero offers —
  Billa/Tesco today, or an unmatched city).
- **`CartPanel`** — reads `useCartStore`; empty state, header count,
  `CartItemRow` per item, footer `Clear cart` (disabled when empty).

### Components

- **`OfferCard`** — header (store dot/name + `ValidityRing`),
  title/subtitle, price row (struck-through regular, bold discounted, green
  `-N%` pill), "Valid until" line, full-width Add-to-cart button toggling
  `useCartStore` membership (outline+`+` vs solid+check).
- **`ValidityRing`** — pure presentational SVG, props `{ ringPercent,
  daysLeft }`, colored via `getUrgencyColor`.
- **`CartItemRow`** — thumbnail placeholder, store dot+name, title, urgency
  -colored "Valid until", price column, remove button.

## State model (Zustand)

- **`useLocationStore`** *(persisted, key `groceries-discount:location`)*:
  `{ country: string | null; city: string | null; setLocation(country,
  city); clear() }`. `country` is the ISO code (`"SK"`).
- **`useCartStore`** *(persisted, key `groceries-discount:cart`)*: `{
  items: CartItem[]; add(offer); remove(offerId); clear(); has(offerId) }`.
  Stores full offer snapshots in add-order (not just ids), so the cart
  panel renders correctly even if an item later drops out of the current
  fetch.
- **`useDashboardUiStore`** *(not persisted)*: `{ selectedStore: StoreName;
  activeCategory: string; cartOpen: boolean }` — defaults `Lidl` / `'All'`
  / `true`. Resets `activeCategory` to `'All'` on store change.

Only `location` and `cart` persist to `localStorage`, per specs.txt.
`cartOpen`/`selectedStore`/`activeCategory` are session-only.

## Explicitly out of scope

- Mobile/tablet layout (design spec covers desktop 1280–1440px only;
  component boundaries are kept clean so a later mobile pass doesn't
  require a rewrite).
- Real Billa/Tesco data (no script provided; stub providers only).
- A store-picker UI for Kaufland's ambiguous-match case (first match is
  taken automatically).
- Countries beyond Slovakia in the seed data (structure supports adding
  more; Kaufland's own `COUNTRY_DOMAINS` map would need updating too before
  another country actually returns real Kaufland data).

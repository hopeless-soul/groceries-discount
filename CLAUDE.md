# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Run from this directory (`groceries-discount/groceries-discount`, not the parent folder).

- `npm run dev` — dev server on http://localhost:3000
- `npm run build` / `npm start` — production build and serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, Next core-web-vitals + TypeScript)
- `npm test` — full Vitest run (jsdom)
- Single file: `npx vitest run components/dashboard/OfferCard.test.tsx`
- Single test by name: `npx vitest run -t "name fragment"` (add a file path to narrow it)
- Typecheck: `npx tsc --noEmit`

`NEXT_PUBLIC_API_URL` in `.env.local` points at the flyer-parser backend (`GET /shops`, `GET /shops/{shop}/offers`). Without it, every shop request throws.

## Architecture

**Routes.** Two pages, both client components. `app/page.tsx` shows `LocationSelectCard` and redirects to `/dashboard` once a country and city are stored. `app/dashboard/page.tsx` redirects back to `/` when they are missing.

**Data pipeline.** The backend API is the only offers source. The layers, in order:

1. `lib/api/dto.ts` mirrors `openapi.json` of `nest-ai-flyer-parser` (`OfferDto` etc.). Keep it identical to the spec.
2. `lib/api/client.ts` fetches `/shops` and `/shops/{shop}/offers`. `lib/api/normalize.ts` turns `OfferDto` into `ApiOffer` (nulls defaulted, sorted by `position`, relative image URLs prefixed with the API base).
3. `useShops` (hooks/useShops.ts) fetches the shop list and derives a `ShopStatus` (`available` / `outdated` / `restricted`) per `ShopKey` through `getShopStatus` (lib/shops.ts). Only `available` shops get an offers request.
4. `useShopOffers` / `useAllShopOffers` (hooks/useShopOffers.ts) fetch offers through `cachedFetch` (lib/cache/fetchCache.ts, 12h TTL).
5. `toDisplayOffer` (lib/display.ts) converts `ApiOffer` into `DisplayOffer` on every render. `daysLeft` and `ringPercent` are never cached, because a cached value goes stale.

Shop and category keys live in `lib/config/shops.ts` and `lib/config/categories.ts`. The shop order in the UI comes from `shopKeys`.

Offer ids come from the API and are stable, so cart entries can key on `id`.

**Client state.** Zustand stores in `lib/stores/`, all persisted to localStorage:
- `cart-store`: `CartItem`, which is an `Offer` plus store info.
- `dashboard-ui-store`: selected store, search, sort, image toggle, panel open states.

**Cache versioning.** `STORAGE_PREFIX` in `lib/cache/fetchCache.ts` is `groceries-discount:cache:v3:`. Bump it whenever the `DashboardData` or `Offer` shape changes, or stale entries will be served for up to 12h.

**Layout.** Responsive behavior comes from `useIsDesktop` (`min-width: 1024px`), used by `CartPanel`, `DashboardSidebar` and `DashboardFilters`. `VirtualizedOfferGrid` uses its own `PHONE_QUERY`. Tests default to desktop through `setDesktop` in `lib/test-utils/matchMedia.ts`.

**Next config.** `next.config.ts` configures SVGR, so SVG imports render as React components. Offer images come from the API host and render with plain `<img>` or CSS background cropping (`components/dashboard/OfferImage.tsx`), not `next/image`.

**Design source.** `../specs/design spec.md` (one level above this directory) and `docs/superpowers/{specs,plans}/` hold the design history.

## Testing

Vitest with jsdom and globals. Tests sit next to their source as `*.test.ts(x)`. `vitest.setup.ts` stubs `ResizeObserver`, and it fakes `offsetHeight`/`offsetWidth` so `@tanstack/react-virtual` renders rows. Without that fake, virtualized lists render nothing in tests.

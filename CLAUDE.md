# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Environment Setup

Before running dev or build, create `.env.local` in this directory with:
```
NEXT_PUBLIC_API_URL=http://localhost:3001  # Replace with your flyer-parser backend
GEOAPIFY_API_KEY=<your-key>               # Used by maps/location features
```

`NEXT_PUBLIC_API_URL` is critical — without it, all shop requests fail. Use `.env.example` as a template.

**Directory note:** Run all commands from this directory (`groceries-discount/groceries-discount`), not the parent folder. The parent (`..`) holds design specs and integration docs.

## Commands

- `npm run dev` — dev server on http://localhost:3000
- `npm run build` / `npm start` — production build and serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, Next core-web-vitals + TypeScript)
- `npm test` — full Vitest run (jsdom, globals, strict mode)
- Single file: `npx vitest run components/dashboard/OfferCard.test.tsx`
- Single test by name: `npx vitest run -t "name fragment"` (add file path to narrow)
- Typecheck: `npx tsc --noEmit` (strict mode enabled, no emit)

## Architecture

**Routes.** Two pages, both client components:
- `app/page.tsx` — location picker showing `LocationSelectCard`, redirects to `/dashboard` once country/city are stored
- `app/dashboard/page.tsx` — main dashboard, redirects back to `/` if location is missing

**Data pipeline.** Backend API (flyer-parser) is the single source of truth. Data flows through:

1. **DTOs** (`lib/api/dto.ts`) — mirrors `openapi.json` spec exactly (`OfferDto`, `ShopDto`, etc.). Keep in sync.
2. **API client** (`lib/api/client.ts`) — fetches `/shops` and `/shops/{shop}/offers`
3. **Normalization** (`lib/api/normalize.ts`) — converts `OfferDto` → `ApiOffer`: defaults nulls, sorts by position, prefixes relative image URLs
4. **Shop hook** (`hooks/useShops.ts`) — fetches shop list, derives `ShopStatus` (available/outdated/restricted) via `getShopStatus` (lib/shops.ts); only `available` shops trigger offers requests
5. **Offer hooks** (`hooks/useShopOffers.ts`) — fetch via `cachedFetch` (12h TTL, keyed by shop)
6. **Display transform** (`lib/display.ts`) — `ApiOffer` → `DisplayOffer` on every render; `daysLeft` and `ringPercent` always fresh (never cached, they go stale)

**Configuration.** Shop and category keys in `lib/config/shops.ts` and `lib/config/categories.ts`. UI shop order follows `shopKeys`. Offer IDs are API-stable, so cart entries key on `id`.

**Client state.** Zustand stores (lib/stores/, all persisted to localStorage):
- `cart-store`: `CartItem` (Offer + store metadata)
- `dashboard-ui-store`: selected store, search, sort, image toggle, panel visibility

**Cache strategy.** `STORAGE_PREFIX` in `lib/cache/fetchCache.ts` is `groceries-discount:cache:v3:`. **Bump the version** whenever `Offer` or `DashboardData` shape changes, else stale data serves for 12h. 

**Responsive design.** `useIsDesktop` (1024px breakpoint) powers `CartPanel`, `DashboardSidebar`, `DashboardFilters`. `VirtualizedOfferGrid` has its own `PHONE_QUERY`. Tests run at desktop by default (via `setDesktop` in `lib/test-utils/matchMedia.ts`).

**SVG handling.** `next.config.ts` configures SVGR for `import Logo from "@/public/x.svg"` → inline `<svg>` component (styleable with CSS). Offer images from API use plain `<img>` or CSS background crop, not `next/image`.

**Path alias.** `@/` resolves to project root (configured in `tsconfig.json`). Use it consistently.

**Design history.** `../specs/design spec.md` (parent dir) and `docs/superpowers/{specs,plans}/` document design decisions.

## Testing

**Setup:** Vitest with jsdom, globals enabled. Tests live next to source as `*.test.ts(x)`.

**jsdom quirks handled by `vitest.setup.ts`:**
- Stubs `ResizeObserver` (no-op for tests)
- Stubs `IntersectionObserver` (no-op for tests)
- Fakes `offsetHeight`/`offsetWidth` to 800px — required for `@tanstack/react-virtual` to render rows; without it, virtualized lists render nothing
- Calls `setDesktop(true)` so tests run at desktop viewport (1024px+)

**Debugging tests:** Add `.only` to focus a single test, or use `-t "pattern"` to filter by name.

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "shops is undefined" or empty array | `NEXT_PUBLIC_API_URL` not set or backend unreachable | Check `.env.local`, verify backend is running |
| Stale offers for hours | Cache version not bumped after data shape change | Bump `STORAGE_PREFIX` in `lib/cache/fetchCache.ts` |
| Offer images broken | Relative URLs not prefixed with API base | Check `lib/api/normalize.ts` — should prefix image URLs |
| Virtualized grid renders no rows in tests | Test environment lacks layout metrics | Already fixed in `vitest.setup.ts`, but check if it was modified |
| TypeScript errors on `@/` imports | Path alias not resolved | Verify `tsconfig.json` includes `"paths": { "@/*": ["./*"] }` |

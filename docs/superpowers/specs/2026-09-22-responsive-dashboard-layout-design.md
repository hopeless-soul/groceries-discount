# Responsive Dashboard Layout

## Problem

`app/dashboard/page.tsx` lays out the dashboard as three fixed-width flex columns: a 240px sidebar (`StoreList` + `CategoryList`), a flexible offer grid, and a 320px `CartPanel`. This only works on wide (pc) screens. Below that, the sidebar and cart panel can't coexist with the grid, and the content header row (search input, "Show images" switch, sort `Select`) overflows.

## Goals

- Keep the existing pc layout and visual design unchanged at `≥1024px` (`lg:`).
- Make the dashboard usable at medium (`768–1023px`) and phone (`<768px`) widths using Tailwind's default breakpoints.
- Reuse shadcn/Radix primitives consistent with the rest of the UI (`components/ui/*`).

## Breakpoints

Tailwind defaults, no custom config:

- **phone**: `<768px` (default, unprefixed classes)
- **medium**: `768–1023px` (`md:`)
- **pc**: `≥1024px` (`lg:`)

Medium and phone share the same structural behavior (drawers instead of static columns); phone just gets tighter spacing within that same structure. There is no separate "tablet-only" layout.

## Layout Changes

### Sidebar (StoreList + CategoryList)

- **pc (`lg:`)**: unchanged — static 240px-wide `<div>` column, always visible, no trigger.
- **medium/phone (`<lg`)**: moves into a shadcn `Drawer` (`components/ui/drawer.tsx`, built on `vaul`) sliding in from the left. Contains the same `StoreList` and `CategoryList` components, unmodified.
  - Trigger: a new floating circular button fixed to the bottom-left of the viewport, visible only `<lg`. Opens the drawer. This is a new UI element with no pc equivalent.
  - Drawer open/close state lives locally in the page (or a small hook), not in `dashboard-ui-store` — it's purely presentational and doesn't need to persist.

### Cart panel

- **pc (`lg:`)**: unchanged — static 320px `<aside>` column, shown when `cartOpen` is true, closed via the existing header Cart button.
- **medium/phone (`<lg`)**: `CartPanel`'s content renders inside a shadcn `Drawer` sliding in from the right instead of a static `<aside>`, controlled by the same existing `cartOpen` / `toggleCartOpen` state from `useDashboardUiStore`. No new trigger — the header's existing Cart button keeps working as-is.
- `CartPanel` becomes responsive internally (renders as a plain column at `lg:`, as `Drawer` content below `lg:`), so callers don't need to branch.

### Content header row (search / show images / sort)

- **pc (`lg:`)**: unchanged — search input left, "Show images" switch + sort `Select` right, single row.
- **medium/phone (`<lg`)**: search input takes the full row width. The "Show images" switch and sort `Select` are removed from the visible row and collapsed behind a single icon button (e.g. a filter/sliders icon) that opens a shadcn `Popover` (`components/ui/popover.tsx`, built on `@radix-ui/react-popover`) containing both controls, stacked vertically. Underlying state (`showImages`, `sortBy` in `dashboard-ui-store`) is unchanged.

### AppHeader

- **pc (`lg:`)**: unchanged — logo left, date centered, location + cart buttons right.
- **medium/phone (`<lg`)**: the "today's date" `<span>` is hidden (`hidden lg:inline` or equivalent). Logo stays left, location + cart buttons stay right, fitting one row.

## New Dependencies

- `vaul` — underlying library for shadcn's `Drawer` component.
- `@radix-ui/react-popover` — underlying library for shadcn's `Popover` component.
- Generated `components/ui/drawer.tsx` and `components/ui/popover.tsx` via the existing shadcn setup, matching the style of current `components/ui/*` files (e.g. `dialog.tsx`).

## Out of Scope

- No changes to data fetching, Zustand stores, or `VirtualizedOfferGrid` internals.
- No changes to the offer grid's own column count/responsiveness beyond it now having full width below `lg:` (existing grid responsiveness, if any, is untouched).
- No new persistence of drawer open/close state across reloads.

## Testing

- Manual checks by user.
- No new automated tests planned beyond existing coverage.

# Paper Receipt Cart Overlay

## Problem

The cart currently only shows as `CartPanel`, a flat list of items with no totals — no grand total, and no breakdown per grocery store even though each `CartItem` already carries `storeId`/`storeLabel`. There's no way to see "how much am I actually spending, and how much at each store" without doing the math manually. The reference mockup (`paper receipt.png`) is a stylized point-of-sale paper receipt: monospace type, torn top/bottom edges, dashed `*` dividers, right-aligned prices, a barcode footer.

## Goals

- Add a floating receipt-icon button that opens a read-only, receipt-styled modal summarizing the cart.
- Group items by store, with a subtotal + savings line per store, and a grand total + total savings at the bottom.
- Match the visual style of the reference image (torn edges, monospace, dashed dividers, barcode) using CSS only.
- Leave existing `CartPanel` (add/remove/clear) untouched — this is a separate, additive view.

## Non-goals

- No editing (remove item / clear cart) from the receipt — that stays in `CartPanel`.
- No printing / PDF export / persistence of past receipts — it's a live view of the current cart only.
- No animation beyond what the existing `Dialog` primitive already provides.

## State

Add to `lib/stores/dashboard-ui-store.ts`:

```ts
receiptOpen: boolean;
toggleReceiptOpen: () => void;
```

Defaults to `false`. Not persisted (not included in `partialize`) — same treatment as `cartOpen`.

## Components

### `components/dashboard/ReceiptButton.tsx`

- Fixed-position circular button, `bottom-6 right-6`, `z-40`.
- Renders only when `items.length > 0` (reads `useCartStore((s) => s.items.length)`).
- Receipt icon (`lucide-react`'s `Receipt`) plus a small count badge.
- `onClick` → `useDashboardUiStore((s) => s.toggleReceiptOpen)`.

### `components/dashboard/ReceiptOverlay.tsx`

- Built on the existing `Dialog` / `DialogPortal` primitives (`components/ui/dialog.tsx`), but with its own popup content — not the generic rounded-card `DialogContent` — since the receipt has custom paper styling that clashes with the default card chrome.
- Controlled by `receiptOpen` / `toggleReceiptOpen` (same pattern `CartPanel` uses with `cartOpen`).
- Derives grouped data from `useCartStore((s) => s.items)`:
  - Group into an ordered `Map<storeId, CartItem[]>` (first-seen order, using `storeLabel` for display).
  - Per group: `subtotal = sum(discountedPrice)`, `regularSubtotal = sum(regularPrice)`, `savings = regularSubtotal - subtotal`.
  - Grand total = sum of all `subtotal`; grand savings = sum of all `savings`.
- Close via a single `×` control positioned over the dimmed backdrop (outside the paper), plus the existing `Escape`/backdrop-click behavior the `Dialog` primitive already provides.

## Layout (top → bottom)

1. Torn zigzag top edge — CSS `clip-path: polygon(...)` repeating triangle pattern on a top strip.
2. Header, centered: "GROCERIES DISCOUNT" (bold, letter-spaced), then current date/time (`toLocaleString()`).
3. Dashed divider (`border-t border-dashed`).
4. Per store group, in order:
   - `STORE LABEL` (uppercase, bold, left-aligned).
   - One row per item: title (left, truncated) — `discountedPrice` (right, monospace, `$X.XX`).
   - Dashed divider.
   - `SUBTOTAL` — subtotal amount (right-aligned).
   - `Saved` — savings amount (right-aligned, smaller/muted), omitted if `savings === 0`.
5. Dashed divider (heavier, separates groups from grand total).
6. `GRAND TOTAL` (bold, larger type) — grand total amount.
7. `TOTAL SAVED` — grand savings, omitted if `0`.
8. "THANK YOU!" centered.
9. Fake barcode: repeating-linear-gradient bars, with item count printed beneath as the "code".
10. Torn zigzag bottom edge (mirrors #1).

## Styling

- `font-mono`, paper background `#fdfdf8`, `shadow-lg`, `max-w-[360px]` centered, `max-h-[85vh] overflow-y-auto` for long carts.
- Dashed dividers and zigzag edges reuse the existing neutral palette (`#e4e4e7`/`#18181b` family) already used elsewhere, adapted to black-on-white receipt look.
- No new dependencies beyond the `Receipt` icon from `lucide-react` (confirm it's already a project dependency before use; if not, use an inline SVG instead).

## Wiring

`ReceiptButton` and `ReceiptOverlay` are rendered once, near where `CartPanel` currently lives (`app/dashboard/page.tsx` or `DashboardSidebar.tsx` — whichever currently composes `CartPanel`), independent of `CartPanel`'s own open/close state.

## Testing

- `ReceiptButton.test.tsx`: hidden when cart empty, visible with count badge when items present, toggles `receiptOpen` on click.
- `ReceiptOverlay.test.tsx`: groups items by store correctly, computes per-store subtotal/savings and grand total/savings correctly, renders nothing when `items.length === 0`, closes on `×` click.

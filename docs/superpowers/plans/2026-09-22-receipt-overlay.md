# Paper Receipt Cart Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating receipt-icon button that opens a read-only, paper-receipt-styled modal summarizing the current cart, grouped by store, with per-store subtotals/savings and a grand total/savings.

**Architecture:** Two new client components (`ReceiptButton`, `ReceiptOverlay`) driven by a new `receiptOpen` boolean in the existing `dashboard-ui-store`, reading items from the existing `cart-store`. `ReceiptOverlay` is built on the existing `Dialog`/`DialogPortal` base-ui primitives but renders its own custom "paper" popup instead of the shared `DialogContent` card. Both new components are composed into `app/dashboard/page.tsx` next to the existing `<CartPanel />`, and don't touch `CartPanel`, `CartItemRow`, or the cart store at all.

**Tech Stack:** Next.js (App Router) + React + TypeScript, Zustand (`create`/`persist`) for state, `@base-ui/react/dialog` for the modal primitive, Tailwind CSS for styling, `lucide-react` for icons, Vitest + Testing Library for tests.

## Global Constraints

- Receipt is read-only: no remove-item or clear-cart controls on it (spec: Non-goals).
- No printing/export/history — live view of current cart only (spec: Non-goals).
- No new npm dependencies beyond `lucide-react`, which is already installed (`package.json:19`, `^1.47.0`) — confirm the `Receipt` icon exists in it before using it; fall back to inline SVG if not.
- `receiptOpen` state is not persisted to `localStorage` (excluded from `partialize`), matching `cartOpen`'s treatment.
- Reuse the existing neutral palette already used elsewhere (`#e4e4e7`, `#71717a`, `#a1a1aa`, `#18181b`-family), adapted to black-on-white receipt styling — no new color tokens.
- Follow existing code conventions: `"use client"` at the top of client components, path alias `@/...` for imports, inline hex colors via `style`/Tailwind arbitrary values consistent with `CartItemRow.tsx` and `CartPanel.tsx`.

---

## File Structure

- **Modify** `lib/stores/dashboard-ui-store.ts` — add `receiptOpen: boolean` and `toggleReceiptOpen: () => void`.
- **Modify** `lib/stores/dashboard-ui-store.test.ts` — cover the new toggle.
- **Create** `lib/receipt.ts` — pure grouping/totals helper (`groupCartItemsByStore`), so the math is unit-testable independent of rendering.
- **Create** `lib/receipt.test.ts` — unit tests for the grouping/totals helper.
- **Create** `components/dashboard/ReceiptButton.tsx` — floating trigger button.
- **Create** `components/dashboard/ReceiptButton.test.tsx`.
- **Create** `components/dashboard/ReceiptOverlay.tsx` — the receipt modal itself.
- **Create** `components/dashboard/ReceiptOverlay.test.tsx`.
- **Modify** `app/dashboard/page.tsx` — render `<ReceiptButton />` and `<ReceiptOverlay />` next to `<CartPanel />`.

---

## Task 1: `receiptOpen` state in `dashboard-ui-store`

**Files:**
- Modify: `lib/stores/dashboard-ui-store.ts`
- Modify: `lib/stores/dashboard-ui-store.test.ts`

**Interfaces:**
- Produces: `useDashboardUiStore((s) => s.receiptOpen): boolean` (default `false`), `useDashboardUiStore((s) => s.toggleReceiptOpen): () => void`.

- [ ] **Step 1: Write the failing test**

Add to `lib/stores/dashboard-ui-store.test.ts`, inside the existing `beforeEach` add `receiptOpen: false` to the `setState` call, and add a new test at the end of the `describe` block:

```ts
  it("toggleReceiptOpen flips the boolean", () => {
    expect(useDashboardUiStore.getState().receiptOpen).toBe(false);
    useDashboardUiStore.getState().toggleReceiptOpen();
    expect(useDashboardUiStore.getState().receiptOpen).toBe(true);
    useDashboardUiStore.getState().toggleReceiptOpen();
    expect(useDashboardUiStore.getState().receiptOpen).toBe(false);
  });
```

Also update the first test's `toMatchObject` call to include `receiptOpen: false`:

```ts
  it("defaults to Lidl / All / cartOpen=true / searchQuery='' / showImages=false", () => {
    expect(useDashboardUiStore.getState()).toMatchObject({
      selectedStore: StoreName.Lidl,
      activeCategory: "All",
      cartOpen: true,
      searchQuery: "",
      showImages: false,
      receiptOpen: false,
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/stores/dashboard-ui-store.test.ts`
Expected: FAIL — `receiptOpen` / `toggleReceiptOpen` are `undefined`.

- [ ] **Step 3: Implement the store change**

In `lib/stores/dashboard-ui-store.ts`, add to the `DashboardUiState` interface (after `cartOpen: boolean;`):

```ts
  receiptOpen: boolean;
```

and after `toggleCartOpen: () => void;`:

```ts
  toggleReceiptOpen: () => void;
```

In the store implementation, after `cartOpen: true,`:

```ts
      receiptOpen: false,
```

and after `toggleCartOpen: () => set((state) => ({ cartOpen: !state.cartOpen })),`:

```ts
      toggleReceiptOpen: () => set((state) => ({ receiptOpen: !state.receiptOpen })),
```

Leave `partialize` untouched — it already only persists `showImages`, so `receiptOpen` is correctly excluded from persistence.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/stores/dashboard-ui-store.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/stores/dashboard-ui-store.ts lib/stores/dashboard-ui-store.test.ts
git commit -m "feat: add receiptOpen state to dashboard UI store"
```

---

## Task 2: `groupCartItemsByStore` helper

**Files:**
- Create: `lib/receipt.ts`
- Create: `lib/receipt.test.ts`

**Interfaces:**
- Consumes: `CartItem` from `@/lib/types` (`lib/types.ts:33-37`) — has `id`, `title`, `regularPrice`, `discountedPrice`, `storeId`, `storeLabel`.
- Produces:
  ```ts
  export interface ReceiptStoreGroup {
    storeId: string;
    storeLabel: string;
    items: CartItem[];
    subtotal: number;
    savings: number;
  }

  export interface ReceiptSummary {
    groups: ReceiptStoreGroup[];
    grandTotal: number;
    grandSavings: number;
  }

  export function groupCartItemsByStore(items: CartItem[]): ReceiptSummary;
  ```
  `ReceiptOverlay` (Task 4) consumes `groupCartItemsByStore` and the `ReceiptSummary`/`ReceiptStoreGroup` shapes exactly as defined here.

- [ ] **Step 1: Write the failing test**

Create `lib/receipt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { groupCartItemsByStore } from "./receipt";
import type { CartItem } from "@/lib/types";

function makeItem(overrides: Partial<CartItem>): CartItem {
  return {
    id: "o1",
    title: "Milk",
    subtitle: "",
    categoryId: "dairy",
    regularPrice: 2,
    discountedPrice: 1,
    discountPercent: 50,
    validUntil: "2026-09-22T00:00:00.000Z",
    daysLeft: 4,
    ringPercent: 50,
    imageUrl: null,
    storeId: "lidl",
    storeLabel: "Lidl",
    storeDotColor: "#2563eb",
    ...overrides,
  };
}

describe("groupCartItemsByStore", () => {
  it("returns an empty summary for an empty cart", () => {
    expect(groupCartItemsByStore([])).toEqual({ groups: [], grandTotal: 0, grandSavings: 0 });
  });

  it("groups a single store's items and computes subtotal/savings", () => {
    const items = [
      makeItem({ id: "o1", regularPrice: 2, discountedPrice: 1 }),
      makeItem({ id: "o2", regularPrice: 5, discountedPrice: 4 }),
    ];
    const summary = groupCartItemsByStore(items);
    expect(summary.groups).toEqual([
      {
        storeId: "lidl",
        storeLabel: "Lidl",
        items,
        subtotal: 5,
        savings: 2,
      },
    ]);
    expect(summary.grandTotal).toBe(5);
    expect(summary.grandSavings).toBe(2);
  });

  it("groups items from multiple stores in first-seen order", () => {
    const lidlItem = makeItem({ id: "o1", storeId: "lidl", storeLabel: "Lidl", regularPrice: 2, discountedPrice: 1 });
    const kauflandItem = makeItem({
      id: "o2",
      storeId: "kaufland",
      storeLabel: "Kaufland",
      regularPrice: 10,
      discountedPrice: 8,
    });
    const lidlItem2 = makeItem({ id: "o3", storeId: "lidl", storeLabel: "Lidl", regularPrice: 3, discountedPrice: 3 });

    const summary = groupCartItemsByStore([lidlItem, kauflandItem, lidlItem2]);

    expect(summary.groups.map((g) => g.storeId)).toEqual(["lidl", "kaufland"]);
    expect(summary.groups[0]).toEqual({
      storeId: "lidl",
      storeLabel: "Lidl",
      items: [lidlItem, lidlItem2],
      subtotal: 4,
      savings: 1,
    });
    expect(summary.groups[1]).toEqual({
      storeId: "kaufland",
      storeLabel: "Kaufland",
      items: [kauflandItem],
      subtotal: 8,
      savings: 2,
    });
    expect(summary.grandTotal).toBe(12);
    expect(summary.grandSavings).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/receipt.test.ts`
Expected: FAIL — cannot find module `./receipt`.

- [ ] **Step 3: Implement the helper**

Create `lib/receipt.ts`:

```ts
import type { CartItem } from "@/lib/types";

export interface ReceiptStoreGroup {
  storeId: string;
  storeLabel: string;
  items: CartItem[];
  subtotal: number;
  savings: number;
}

export interface ReceiptSummary {
  groups: ReceiptStoreGroup[];
  grandTotal: number;
  grandSavings: number;
}

export function groupCartItemsByStore(items: CartItem[]): ReceiptSummary {
  const order: string[] = [];
  const byStore = new Map<string, CartItem[]>();

  for (const item of items) {
    if (!byStore.has(item.storeId)) {
      byStore.set(item.storeId, []);
      order.push(item.storeId);
    }
    byStore.get(item.storeId)!.push(item);
  }

  const groups: ReceiptStoreGroup[] = order.map((storeId) => {
    const storeItems = byStore.get(storeId)!;
    const subtotal = storeItems.reduce((sum, i) => sum + i.discountedPrice, 0);
    const regularSubtotal = storeItems.reduce((sum, i) => sum + i.regularPrice, 0);
    return {
      storeId,
      storeLabel: storeItems[0].storeLabel,
      items: storeItems,
      subtotal,
      savings: regularSubtotal - subtotal,
    };
  });

  const grandTotal = groups.reduce((sum, g) => sum + g.subtotal, 0);
  const grandSavings = groups.reduce((sum, g) => sum + g.savings, 0);

  return { groups, grandTotal, grandSavings };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/receipt.test.ts`
Expected: PASS (all 3 tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/receipt.ts lib/receipt.test.ts
git commit -m "feat: add groupCartItemsByStore helper for receipt totals"
```

---

## Task 3: `ReceiptButton`

**Files:**
- Create: `components/dashboard/ReceiptButton.tsx`
- Create: `components/dashboard/ReceiptButton.test.tsx`

**Interfaces:**
- Consumes: `useCartStore((s) => s.items): CartItem[]` (`lib/stores/cart-store.ts:13-25`), `useDashboardUiStore((s) => s.toggleReceiptOpen): () => void` (Task 1).
- Produces: `ReceiptButton` component, no props. Rendered by `app/dashboard/page.tsx` (Task 5).

- [ ] **Step 1: Write the failing test**

Create `components/dashboard/ReceiptButton.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiptButton } from "./ReceiptButton";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

const item = {
  id: "o1",
  title: "Milk",
  subtitle: "",
  categoryId: "dairy",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
  imageUrl: null,
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
};

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({ receiptOpen: false });
});

describe("ReceiptButton", () => {
  it("renders nothing when the cart is empty", () => {
    render(<ReceiptButton />);
    expect(screen.queryByRole("button", { name: /view receipt/i })).not.toBeInTheDocument();
  });

  it("shows a count badge and toggles receiptOpen when clicked", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [item] });
    render(<ReceiptButton />);

    const button = screen.getByRole("button", { name: /view receipt/i });
    expect(button).toHaveTextContent("1");

    await user.click(button);
    expect(useDashboardUiStore.getState().receiptOpen).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/dashboard/ReceiptButton.test.tsx`
Expected: FAIL — cannot find module `./ReceiptButton`.

- [ ] **Step 3: Implement the component**

Create `components/dashboard/ReceiptButton.tsx`:

```tsx
"use client";

import { Receipt } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function ReceiptButton() {
  const itemCount = useCartStore((s) => s.items.length);
  const toggleReceiptOpen = useDashboardUiStore((s) => s.toggleReceiptOpen);

  if (itemCount === 0) return null;

  return (
    <button
      type="button"
      aria-label="View receipt"
      onClick={toggleReceiptOpen}
      className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#18181b] text-white shadow-lg"
    >
      <Receipt className="h-5 w-5" />
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dc2626] px-1 text-xs font-bold text-white">
        {itemCount}
      </span>
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/dashboard/ReceiptButton.test.tsx`
Expected: PASS (both tests green).

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/ReceiptButton.tsx components/dashboard/ReceiptButton.test.tsx
git commit -m "feat: add floating ReceiptButton"
```

---

## Task 4: `ReceiptOverlay`

**Files:**
- Create: `components/dashboard/ReceiptOverlay.tsx`
- Create: `components/dashboard/ReceiptOverlay.test.tsx`

**Interfaces:**
- Consumes:
  - `useCartStore((s) => s.items): CartItem[]` (`lib/stores/cart-store.ts`).
  - `useDashboardUiStore((s) => s.receiptOpen): boolean`, `useDashboardUiStore((s) => s.toggleReceiptOpen): () => void` (Task 1).
  - `groupCartItemsByStore(items): ReceiptSummary` and `ReceiptStoreGroup` (Task 2, `@/lib/receipt`).
  - `Dialog`, `DialogPortal` from `@/components/ui/dialog` (`components/ui/dialog.tsx:7,11-24`) — `DialogPortal` already renders the backdrop; `DialogContent`'s card styling is intentionally *not* reused here per the design.
- Produces: `ReceiptOverlay` component, no props. Rendered by `app/dashboard/page.tsx` (Task 5).

- [ ] **Step 1: Write the failing test**

Create `components/dashboard/ReceiptOverlay.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiptOverlay } from "./ReceiptOverlay";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import type { CartItem } from "@/lib/types";

function makeItem(overrides: Partial<CartItem>): CartItem {
  return {
    id: "o1",
    title: "Milk",
    subtitle: "",
    categoryId: "dairy",
    regularPrice: 2,
    discountedPrice: 1,
    discountPercent: 50,
    validUntil: "2026-09-22T00:00:00.000Z",
    daysLeft: 4,
    ringPercent: 50,
    imageUrl: null,
    storeId: "lidl",
    storeLabel: "Lidl",
    storeDotColor: "#2563eb",
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({ receiptOpen: false });
});

describe("ReceiptOverlay", () => {
  it("renders nothing when the cart is empty, even if receiptOpen is true", () => {
    useDashboardUiStore.setState({ receiptOpen: true });
    render(<ReceiptOverlay />);
    expect(screen.queryByText(/grand total/i)).not.toBeInTheDocument();
  });

  it("renders nothing when receiptOpen is false", () => {
    useCartStore.setState({ items: [makeItem({})] });
    render(<ReceiptOverlay />);
    expect(screen.queryByText(/grand total/i)).not.toBeInTheDocument();
  });

  it("groups items by store and shows subtotals, savings, and grand total", () => {
    const lidlItem = makeItem({ id: "o1", storeId: "lidl", storeLabel: "Lidl", regularPrice: 2, discountedPrice: 1 });
    const kauflandItem = makeItem({
      id: "o2",
      storeId: "kaufland",
      storeLabel: "Kaufland",
      regularPrice: 10,
      discountedPrice: 8,
    });
    useCartStore.setState({ items: [lidlItem, kauflandItem] });
    useDashboardUiStore.setState({ receiptOpen: true });

    render(<ReceiptOverlay />);

    expect(screen.getByText("LIDL")).toBeInTheDocument();
    expect(screen.getByText("KAUFLAND")).toBeInTheDocument();
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.getByText(/grand total/i)).toBeInTheDocument();
    expect(screen.getByText("9.00")).toBeInTheDocument();
    expect(screen.getByText(/total saved/i)).toBeInTheDocument();
    expect(screen.getByText("3.00")).toBeInTheDocument();
  });

  it("closing via the close button toggles receiptOpen off", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [makeItem({})] });
    useDashboardUiStore.setState({ receiptOpen: true });
    render(<ReceiptOverlay />);

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(useDashboardUiStore.getState().receiptOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/dashboard/ReceiptOverlay.test.tsx`
Expected: FAIL — cannot find module `./ReceiptOverlay`.

- [ ] **Step 3: Implement the component**

Create `components/dashboard/ReceiptOverlay.tsx`:

```tsx
"use client";

import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { groupCartItemsByStore, type ReceiptStoreGroup } from "@/lib/receipt";

const ZIGZAG_EDGE =
  "linear-gradient(135deg, transparent 8px, #fdfdf8 8px) 0 0, linear-gradient(-135deg, transparent 8px, #fdfdf8 8px) 0 0";

function ZigzagEdge() {
  return (
    <div
      aria-hidden
      className="h-3 w-full bg-[#fdfdf8]"
      style={{
        backgroundImage: ZIGZAG_EDGE,
        backgroundSize: "16px 16px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

function StoreGroupBlock({ group }: { group: ReceiptStoreGroup }) {
  return (
    <div className="py-3">
      <p className="text-sm font-bold uppercase">{group.storeLabel}</p>
      {group.items.map((item) => (
        <div key={item.id} className="flex justify-between gap-3 py-1 text-sm">
          <span className="truncate">{item.title}</span>
          <span className="flex-shrink-0">{item.discountedPrice.toFixed(2)}</span>
        </div>
      ))}
      <div className="mt-2 border-t border-dashed border-[#18181b]/40 pt-2">
        <div className="flex justify-between text-sm font-semibold">
          <span>SUBTOTAL</span>
          <span>{group.subtotal.toFixed(2)}</span>
        </div>
        {group.savings > 0 && (
          <div className="flex justify-between text-xs text-[#71717a]">
            <span>Saved</span>
            <span>{group.savings.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReceiptOverlay() {
  const items = useCartStore((s) => s.items);
  const receiptOpen = useDashboardUiStore((s) => s.receiptOpen);
  const toggleReceiptOpen = useDashboardUiStore((s) => s.toggleReceiptOpen);

  if (items.length === 0) return null;

  const { groups, grandTotal, grandSavings } = groupCartItemsByStore(items);

  return (
    <Dialog
      open={receiptOpen}
      onOpenChange={(open) => {
        if (open !== receiptOpen) toggleReceiptOpen();
      }}
    >
      <DialogPortal>
        <button
          type="button"
          aria-label="Close"
          onClick={toggleReceiptOpen}
          className="fixed right-6 top-6 z-50 text-2xl text-white"
        >
          ×
        </button>
        <div className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto font-mono text-[#18181b] shadow-lg">
          <ZigzagEdge />
          <div className="bg-[#fdfdf8] px-5 py-4">
            <p className="text-center text-base font-bold tracking-widest">GROCERIES DISCOUNT</p>
            <p className="text-center text-xs text-[#71717a]">{new Date().toLocaleString()}</p>

            <div className="my-3 border-t border-dashed border-[#18181b]/40" />

            {groups.map((group) => (
              <StoreGroupBlock key={group.storeId} group={group} />
            ))}

            <div className="my-2 border-t-2 border-dashed border-[#18181b]" />

            <div className="flex justify-between text-lg font-bold">
              <span>GRAND TOTAL</span>
              <span>{grandTotal.toFixed(2)}</span>
            </div>
            {grandSavings > 0 && (
              <div className="flex justify-between text-sm text-[#15803d]">
                <span>TOTAL SAVED</span>
                <span>{grandSavings.toFixed(2)}</span>
              </div>
            )}

            <p className="mt-4 text-center text-sm font-bold">THANK YOU!</p>

            <div
              aria-hidden
              className="mx-auto mt-3 h-10 w-full max-w-[220px]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #18181b 0, #18181b 2px, transparent 2px, transparent 5px)",
              }}
            />
            <p className="text-center text-xs text-[#71717a]">
              {groups.reduce((sum, g) => sum + g.items.length, 0)} ITEMS
            </p>
          </div>
          <ZigzagEdge />
        </div>
      </DialogPortal>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/dashboard/ReceiptOverlay.test.tsx`
Expected: PASS (all 4 tests green).

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/ReceiptOverlay.tsx components/dashboard/ReceiptOverlay.test.tsx
git commit -m "feat: add ReceiptOverlay paper-receipt cart summary"
```

---

## Task 5: Wire into the dashboard page

**Files:**
- Modify: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `ReceiptButton` (Task 3, `@/components/dashboard/ReceiptButton`), `ReceiptOverlay` (Task 4, `@/components/dashboard/ReceiptOverlay`).

- [ ] **Step 1: Write the failing test**

Create a minimal integration check in a temporary local test isn't warranted here since `page.tsx` currently has no dedicated test file and requires heavy routing/data mocks; instead verify manually per Step 4 below by running the dev server. Skip to Step 2.

- [ ] **Step 2: Add the imports**

In `app/dashboard/page.tsx`, after the existing `CartPanel` import (line 9):

```tsx
import { ReceiptButton } from "@/components/dashboard/ReceiptButton";
import { ReceiptOverlay } from "@/components/dashboard/ReceiptOverlay";
```

- [ ] **Step 3: Render the new components**

Replace:

```tsx
        <CartPanel />
      </div>
    </div>
  );
}
```

with:

```tsx
        <CartPanel />
      </div>
      <ReceiptButton />
      <ReceiptOverlay />
    </div>
  );
}
```

(`ReceiptButton` and `ReceiptOverlay` are fixed-position/portal-based, so they're placed as siblings of the `flex flex-1 overflow-hidden` row, not inside it.)

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, open the dashboard, add at least two offers from different stores to the cart (or if only one store is selectable at a time, add two items then switch store and add another — check `DashboardSidebar`/store switcher for how to change `selectedStore`), confirm:
- A circular receipt button appears bottom-right with a count badge.
- Clicking it opens the receipt modal, showing items grouped under each store's uppercase label, per-store subtotal + "Saved" line, a "GRAND TOTAL" and "TOTAL SAVED" line, "THANK YOU!", and a barcode-style bar.
- Clicking the `×` closes it.
- Clearing the cart via the existing `CartPanel` "Clear cart" button makes the receipt button disappear.

Expected: all of the above hold true visually in the browser.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS — no regressions in any existing test file.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: wire ReceiptButton and ReceiptOverlay into the dashboard page"
```

---

## Self-Review Notes

- **Spec coverage:** floating button (Task 3) ✓; read-only modal (Task 4, no remove/clear controls) ✓; grouped by store with per-store subtotal + savings (Task 2 + 4) ✓; grand total + total savings (Task 2 + 4) ✓; torn top/bottom edges, monospace, dashed dividers, barcode (Task 4 `ZigzagEdge`/`font-mono`/dashed borders/gradient bar) ✓; `receiptOpen` state not persisted (Task 1, `partialize` untouched) ✓; wiring next to `CartPanel` (Task 5) ✓.
- **Placeholder scan:** no TBD/TODO; every step has full code or an exact manual-verification checklist.
- **Type consistency:** `ReceiptSummary`/`ReceiptStoreGroup` defined once in Task 2 and consumed with identical shapes in Task 4; `receiptOpen`/`toggleReceiptOpen` defined once in Task 1 and consumed identically in Tasks 3 and 4.

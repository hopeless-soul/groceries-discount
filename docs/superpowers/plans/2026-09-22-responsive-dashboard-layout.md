# Responsive Dashboard Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `app/dashboard/page.tsx` usable at phone (`<768px`) and medium (`768–1023px`) widths by collapsing the fixed sidebar and cart panel into drawers and the header's image/sort controls into a popover, while leaving the `≥1024px` (`lg:`) layout untouched.

**Architecture:** A single `useMediaQuery`/`useIsDesktop` hook (backed by `window.matchMedia`, mocked in tests) drives self-contained responsive branching inside three components — `DashboardSidebar`, `CartPanel`, and `DashboardFilters` — so `app/dashboard/page.tsx` only changes call sites, not layout logic. Drawers and the popover are built on `@base-ui/react/drawer` and `@base-ui/react/popover` (already a project dependency via `@base-ui/react`), wrapped as `components/ui/drawer.tsx` and `components/ui/popover.tsx` following the existing `components/ui/dialog.tsx` pattern.

**Tech Stack:** Next.js 16, React 19, `@base-ui/react` (Dialog/Drawer/Popover/Switch/Select primitives), Tailwind CSS v4, Zustand, Vitest + Testing Library.

## Global Constraints

- Breakpoints (Tailwind defaults, no custom config): phone `<768px` (unprefixed), medium `768–1023px` (`md:`), pc `≥1024px` (`lg:`). Medium and phone share identical structural behavior.
- `≥1024px` (`lg:`) visual design and DOM structure must stay exactly as it is today.
- No new npm dependencies — `@base-ui/react` already ships `drawer` and `popover` submodules.
- No changes to data fetching, Zustand store shapes, or `VirtualizedOfferGrid` internals.
- Match existing code style: hardcoded hex colors (e.g. `#e4e4e7`) as used throughout `components/dashboard/*` and `components/layout/*`, `"use client"` at the top of every interactive component, `cn` from the `cn` package for class merging in `components/ui/*`.

---

## File Structure

- Create `hooks/useMediaQuery.ts` — generic `matchMedia`-backed hook.
- Create `hooks/useMediaQuery.test.ts` — unit tests using a mocked `matchMedia`.
- Create `hooks/useIsDesktop.ts` — `useMediaQuery("(min-width: 1024px)")` convenience wrapper.
- Create `lib/test-utils/matchMedia.ts` — test helper to mock `window.matchMedia` (`setDesktop(matches: boolean)`).
- Modify `vitest.setup.ts` — install the `matchMedia` mock, defaulting to desktop (`true`), so all existing tests keep exercising the `lg:` layout unchanged.
- Create `components/ui/drawer.tsx` — `Drawer`, `DrawerTrigger`, `DrawerClose`, `DrawerPortal`, `DrawerContent` (with a `side: "left" | "right"` prop), mirroring `components/ui/dialog.tsx`.
- Create `components/ui/popover.tsx` — `Popover`, `PopoverTrigger`, `PopoverContent`, mirroring `components/ui/select.tsx`'s positioner/popup styling.
- Create `components/dashboard/DashboardSidebar.tsx` — renders the existing static sidebar column on desktop; renders a bottom-left floating trigger + left-side `Drawer` containing `StoreList`/`CategoryList` below `lg:`.
- Create `components/dashboard/DashboardSidebar.test.tsx`.
- Create `components/dashboard/DashboardFilters.tsx` — renders the existing inline "Show images" switch + sort `Select` on desktop; renders a single icon button opening a `Popover` with the same controls below `lg:`. Exports `SORT_LABELS` (moved from `app/dashboard/page.tsx`).
- Create `components/dashboard/DashboardFilters.test.tsx`.
- Modify `components/dashboard/CartPanel.tsx` — renders the existing static `<aside>` on desktop (gated on `cartOpen`, as today); renders a right-side `Drawer` controlled by `cartOpen`/`toggleCartOpen` below `lg:`.
- Modify `components/dashboard/CartPanel.test.tsx` — add mobile-branch coverage.
- Modify `components/layout/AppHeader.tsx` — hide the date `<span>` below `lg:` via a Tailwind class.
- Modify `components/layout/AppHeader.test.tsx` — assert the date carries the responsive-hide class.
- Modify `app/dashboard/page.tsx` — replace the inline sidebar `<div>`, inline switch/select row, and `{cartOpen && <CartPanel />}` guard with `<DashboardSidebar>`, `<DashboardFilters>`, and an unconditional `<CartPanel />`.

---

## Task 1: `useMediaQuery`/`useIsDesktop` hooks and test `matchMedia` mock

**Files:**
- Create: `hooks/useMediaQuery.ts`
- Create: `hooks/useMediaQuery.test.ts`
- Create: `hooks/useIsDesktop.ts`
- Create: `lib/test-utils/matchMedia.ts`
- Modify: `vitest.setup.ts`

**Interfaces:**
- Produces: `useMediaQuery(query: string): boolean` (default export style: named export) from `@/hooks/useMediaQuery`.
- Produces: `useIsDesktop(): boolean` from `@/hooks/useIsDesktop`, and `DESKTOP_QUERY = "(min-width: 1024px)"`.
- Produces: `setDesktop(matches: boolean): void` from `@/lib/test-utils/matchMedia`, used by every later task's tests to switch between desktop/mobile branches.

- [ ] **Step 1: Write the test `matchMedia` helper**

```ts
// lib/test-utils/matchMedia.ts
import { vi } from "vitest";

export function setDesktop(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}
```

- [ ] **Step 2: Install the default mock in `vitest.setup.ts`**

Add to the end of `vitest.setup.ts`:

```ts
import { setDesktop } from "@/lib/test-utils/matchMedia";

setDesktop(true);
```

- [ ] **Step 3: Write the failing test for `useMediaQuery`**

```ts
// hooks/useMediaQuery.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";
import { setDesktop } from "@/lib/test-utils/matchMedia";

afterEach(() => setDesktop(true));

describe("useMediaQuery", () => {
  it("returns true when the query matches", () => {
    setDesktop(true);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(true);
  });

  it("returns false when the query does not match", () => {
    setDesktop(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- hooks/useMediaQuery.test.ts`
Expected: FAIL with a module-not-found error for `./useMediaQuery`.

- [ ] **Step 5: Implement `useMediaQuery`**

```ts
// hooks/useMediaQuery.ts
"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const getMatches = () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false);

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = () => setMatches(mediaQueryList.matches);
    listener();
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
```

- [ ] **Step 6: Implement `useIsDesktop`**

```ts
// hooks/useIsDesktop.ts
"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";

export const DESKTOP_QUERY = "(min-width: 1024px)";

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -- hooks/useMediaQuery.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 8: Run the full suite to confirm the new setup doesn't break anything**

Run: `npm test`
Expected: PASS (all existing tests green — `setDesktop(true)` keeps every current test on the desktop branch, and no component reads `useIsDesktop` yet)

- [ ] **Step 9: Commit**

```bash
git add hooks/useMediaQuery.ts hooks/useMediaQuery.test.ts hooks/useIsDesktop.ts lib/test-utils/matchMedia.ts vitest.setup.ts
git commit -m "$(cat <<'EOF'
Add useMediaQuery/useIsDesktop hooks with mocked matchMedia in tests

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FbyJvLFUw5CRSMrCTBghMS
EOF
)"
```

---

## Task 2: `components/ui/drawer.tsx` and `components/ui/popover.tsx`

**Files:**
- Create: `components/ui/drawer.tsx`
- Create: `components/ui/popover.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `Drawer`, `DrawerTrigger`, `DrawerClose`, `DrawerPortal`, `DrawerContent` from `@/components/ui/drawer`. `DrawerContent` accepts `side?: "left" | "right"` (default `"left"`) plus all `DrawerPrimitive.Popup` props (`className`, `children`, etc.).
- Produces: `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover`. `PopoverContent` accepts all `PopoverPrimitive.Popup` props plus the positioning props `side`/`sideOffset`/`align` (defaulted).

No dedicated tests for this task — `components/ui/*` has no existing test files (see `components/ui/dialog.tsx`, `switch.tsx`, `select.tsx`), and this task's components are exercised indirectly through Tasks 3–5's component tests. This matches the codebase's existing convention for `components/ui/*` primitives.

- [ ] **Step 1: Write `components/ui/drawer.tsx`**

```tsx
"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { cn } from "cn"

const Drawer = DrawerPrimitive.Root
const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerClose = DrawerPrimitive.Close

function DrawerPortal({
  side = "left",
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal> & { side?: "left" | "right" }) {
  return (
    <DrawerPrimitive.Portal {...props}>
      <DrawerPrimitive.Backdrop
        data-slot="drawer-backdrop"
        className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className={cn(
          "fixed inset-y-0 z-50 flex",
          side === "left" ? "left-0 justify-start" : "right-0 justify-end"
        )}
      >
        {children}
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

function DrawerContent({
  className,
  side = "left",
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Popup> & { side?: "left" | "right" }) {
  return (
    <DrawerPortal side={side}>
      <DrawerPrimitive.Popup
        data-slot="drawer-content"
        className={cn(
          "flex h-full w-[280px] flex-col overflow-y-auto bg-white shadow-lg outline-none [transform:translateX(var(--drawer-swipe-movement-x))] data-ending-style:duration-150 data-starting-style:duration-150",
          side === "left" ? "border-r border-[#e4e4e7]" : "border-l border-[#e4e4e7]",
          className
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Popup>
    </DrawerPortal>
  )
}

export { Drawer, DrawerTrigger, DrawerClose, DrawerPortal, DrawerContent }
```

- [ ] **Step 2: Write `components/ui/popover.tsx`**

```tsx
"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "cn"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverClose = PopoverPrimitive.Close

function PopoverContent({
  className,
  side = "bottom",
  sideOffset = 8,
  align = "end",
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> &
  Pick<React.ComponentProps<typeof PopoverPrimitive.Positioner>, "side" | "sideOffset" | "align">) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} className="isolate z-50">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "relative isolate z-50 rounded-lg border border-[#e4e4e7] bg-white p-4 shadow-md outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverClose, PopoverContent }
```

- [ ] **Step 3: Verify the project still typechecks and lints**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `components/ui/drawer.tsx` or `components/ui/popover.tsx`

Run: `npm run lint`
Expected: no new errors in the two new files

- [ ] **Step 4: Commit**

```bash
git add components/ui/drawer.tsx components/ui/popover.tsx
git commit -m "$(cat <<'EOF'
Add Drawer and Popover UI primitives on top of @base-ui/react

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FbyJvLFUw5CRSMrCTBghMS
EOF
)"
```

---

## Task 3: `DashboardSidebar` (sidebar drawer)

**Files:**
- Create: `components/dashboard/DashboardSidebar.tsx`
- Create: `components/dashboard/DashboardSidebar.test.tsx`

**Interfaces:**
- Consumes: `useIsDesktop()` from `@/hooks/useIsDesktop` (Task 1); `Drawer`, `DrawerContent`, `DrawerTrigger` from `@/components/ui/drawer` (Task 2); existing `StoreList` (`@/components/dashboard/StoreList`, no props) and `CategoryList` (`@/components/dashboard/CategoryList`, props `{ categories: Category[]; totalCount: number }`) unchanged.
- Produces: `DashboardSidebar({ categories, totalCount }: { categories: Category[]; totalCount: number })` from `@/components/dashboard/DashboardSidebar`, a default-less named export, used by `app/dashboard/page.tsx` in Task 6.

- [ ] **Step 1: Write the failing tests**

```tsx
// components/dashboard/DashboardSidebar.test.tsx
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardSidebar } from "./DashboardSidebar";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";
import { setDesktop } from "@/lib/test-utils/matchMedia";

const categories = [{ id: "bakery", name: "Bakery", count: 1 }];

beforeEach(() => {
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
});

afterEach(() => setDesktop(true));

describe("DashboardSidebar", () => {
  it("renders stores and categories directly on desktop, with no menu trigger", () => {
    setDesktop(true);
    render(<DashboardSidebar categories={categories} totalCount={1} />);
    expect(screen.getByRole("button", { name: /lidl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bakery/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open menu/i })).not.toBeInTheDocument();
  });

  it("hides stores/categories behind a menu trigger on mobile, opened on click", async () => {
    setDesktop(false);
    const user = userEvent.setup();
    render(<DashboardSidebar categories={categories} totalCount={1} />);

    expect(screen.queryByRole("button", { name: /^lidl$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(await screen.findByRole("button", { name: /lidl/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- components/dashboard/DashboardSidebar.test.tsx`
Expected: FAIL with a module-not-found error for `./DashboardSidebar`.

- [ ] **Step 3: Implement `DashboardSidebar`**

```tsx
// components/dashboard/DashboardSidebar.tsx
"use client";

import { Menu } from "lucide-react";
import { StoreList } from "@/components/dashboard/StoreList";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { Category } from "@/lib/types";

interface DashboardSidebarProps {
  categories: Category[];
  totalCount: number;
}

export function DashboardSidebar({ categories, totalCount }: DashboardSidebarProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div className="w-[240px] overflow-y-auto border-r border-[#e4e4e7] bg-white">
        <StoreList />
        <CategoryList categories={categories} totalCount={totalCount} />
      </div>
    );
  }

  return (
    <Drawer swipeDirection="left">
      <DrawerTrigger
        aria-label="Open menu"
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e4e7] bg-white shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </DrawerTrigger>
      <DrawerContent side="left">
        <StoreList />
        <CategoryList categories={categories} totalCount={totalCount} />
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- components/dashboard/DashboardSidebar.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/DashboardSidebar.tsx components/dashboard/DashboardSidebar.test.tsx
git commit -m "$(cat <<'EOF'
Add DashboardSidebar with a left drawer below lg breakpoint

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FbyJvLFUw5CRSMrCTBghMS
EOF
)"
```

---

## Task 4: `DashboardFilters` (show-images + sort popover)

**Files:**
- Create: `components/dashboard/DashboardFilters.tsx`
- Create: `components/dashboard/DashboardFilters.test.tsx`

**Interfaces:**
- Consumes: `useIsDesktop()` (Task 1); `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover` (Task 2); existing `Switch` (`@/components/ui/switch`, props `{ checked: boolean; onCheckedChange: () => void }`), `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue` (`@/components/ui/select`); `SortOption` type from `@/lib/stores/dashboard-ui-store`.
- Produces: `DashboardFilters({ showImages, toggleShowImages, sortBy, setSortBy }: { showImages: boolean; toggleShowImages: () => void; sortBy: SortOption; setSortBy: (sort: SortOption) => void })` and `SORT_LABELS: Record<SortOption, string>` from `@/components/dashboard/DashboardFilters`, used by `app/dashboard/page.tsx` in Task 6 (which currently defines `SORT_LABELS` itself and must drop that local copy).

- [ ] **Step 1: Write the failing tests**

```tsx
// components/dashboard/DashboardFilters.test.tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardFilters } from "./DashboardFilters";
import { setDesktop } from "@/lib/test-utils/matchMedia";

function renderFilters(overrides: Partial<React.ComponentProps<typeof DashboardFilters>> = {}) {
  const props = {
    showImages: false,
    toggleShowImages: vi.fn(),
    sortBy: "default" as const,
    setSortBy: vi.fn(),
    ...overrides,
  };
  render(<DashboardFilters {...props} />);
  return props;
}

afterEach(() => setDesktop(true));

describe("DashboardFilters", () => {
  it("renders the switch and sort select directly on desktop", () => {
    setDesktop(true);
    renderFilters();
    expect(screen.getByRole("switch", { name: /show images/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /sort by/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /filters/i })).not.toBeInTheDocument();
  });

  it("toggling the switch on desktop calls toggleShowImages", async () => {
    setDesktop(true);
    const user = userEvent.setup();
    const { toggleShowImages } = renderFilters();
    await user.click(screen.getByRole("switch", { name: /show images/i }));
    expect(toggleShowImages).toHaveBeenCalledOnce();
  });

  it("hides the controls behind a Filters button on mobile, opened on click", async () => {
    setDesktop(false);
    const user = userEvent.setup();
    renderFilters();

    expect(screen.queryByRole("switch", { name: /show images/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /filters/i }));

    expect(await screen.findByRole("switch", { name: /show images/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- components/dashboard/DashboardFilters.test.tsx`
Expected: FAIL with a module-not-found error for `./DashboardFilters`.

- [ ] **Step 3: Implement `DashboardFilters`**

```tsx
// components/dashboard/DashboardFilters.tsx
"use client";

import { SlidersHorizontal } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { SortOption } from "@/lib/stores/dashboard-ui-store";

export const SORT_LABELS: Record<SortOption, string> = {
  default: "Default",
  discountPercent: "Most discounted %",
  discountAmount: "Most discounted €",
};

interface DashboardFiltersProps {
  showImages: boolean;
  toggleShowImages: () => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
}

function SortSelect({ sortBy, setSortBy }: Pick<DashboardFiltersProps, "sortBy" | "setSortBy">) {
  return (
    <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
      <SelectTrigger aria-label="Sort by" className="w-full">
        <SelectValue placeholder="Sort">{(value) => SORT_LABELS[value as SortOption]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
          <SelectItem key={option} value={option}>
            {SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DashboardFilters({ showImages, toggleShowImages, sortBy, setSortBy }: DashboardFiltersProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div className="flex items-center">
        <label className="ml-4 flex items-center gap-2 text-sm text-[#71717a]">
          <Switch checked={showImages} onCheckedChange={toggleShowImages} />
          Show images
        </label>
        <div className="ml-4 w-[190px]">
          <SortSelect sortBy={sortBy} setSortBy={setSortBy} />
        </div>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Filters"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-[#e4e4e7] bg-white"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="flex w-[220px] flex-col gap-4">
        <label className="flex items-center justify-between gap-2 text-sm text-[#71717a]">
          Show images
          <Switch checked={showImages} onCheckedChange={toggleShowImages} />
        </label>
        <SortSelect sortBy={sortBy} setSortBy={setSortBy} />
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- components/dashboard/DashboardFilters.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/DashboardFilters.tsx components/dashboard/DashboardFilters.test.tsx
git commit -m "$(cat <<'EOF'
Add DashboardFilters, collapsing show-images/sort into a popover below lg

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FbyJvLFUw5CRSMrCTBghMS
EOF
)"
```

---

## Task 5: `CartPanel` responsive drawer

**Files:**
- Modify: `components/dashboard/CartPanel.tsx`
- Modify: `components/dashboard/CartPanel.test.tsx`

**Interfaces:**
- Consumes: `useIsDesktop()` (Task 1); `Drawer`, `DrawerContent` from `@/components/ui/drawer` (Task 2); existing `useCartStore`, `useDashboardUiStore`, `CartItemRow`, `Button` — all unchanged.
- Produces: `CartPanel()` from `@/components/dashboard/CartPanel` — same zero-prop signature as today, now always safe to mount unconditionally (it returns `null` itself when appropriate), used by `app/dashboard/page.tsx` in Task 6.

- [ ] **Step 1: Add failing tests for the mobile branch**

Add to the bottom of `components/dashboard/CartPanel.test.tsx` (keep every existing `it` in the file unchanged):

```tsx
import { setDesktop } from "@/lib/test-utils/matchMedia";
```

Add this import alongside the existing imports at the top of the file, and add `afterEach(() => setDesktop(true));` next to the existing `beforeEach`. Then append:

```tsx
describe("CartPanel on mobile", () => {
  it("renders cart content inside a drawer when cartOpen is true", () => {
    setDesktop(false);
    render(<CartPanel />);
    expect(screen.getByText("Cart · 0")).toBeInTheDocument();
  });

  it("renders no cart content when cartOpen is false", () => {
    setDesktop(false);
    useDashboardUiStore.setState({ cartOpen: false });
    render(<CartPanel />);
    expect(screen.queryByText(/cart ·/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npm test -- components/dashboard/CartPanel.test.tsx`
Expected: the two new tests FAIL (drawer branch doesn't exist yet — the current unconditional `<aside>` still renders regardless of viewport, so "renders no cart content when cartOpen is false" fails because content is still shown)

- [ ] **Step 3: Implement the responsive `CartPanel`**

```tsx
// components/dashboard/CartPanel.tsx
"use client";

import { Button } from "@/components/ui/button";
import { CartItemRow } from "@/components/dashboard/CartItemRow";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function CartPanel() {
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const cartOpen = useDashboardUiStore((s) => s.cartOpen);
  const toggleCartOpen = useDashboardUiStore((s) => s.toggleCartOpen);
  const isDesktop = useIsDesktop();

  const content = (
    <>
      <div className="flex h-[60px] items-center justify-between border-b border-[#e4e4e7] px-4">
        <span className="text-sm font-semibold">Cart · {items.length}</span>
        <button type="button" aria-label="Close" onClick={toggleCartOpen} className="text-[#a1a1aa]">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#a1a1aa]">No items in your cart yet.</p>
        ) : (
          items.map((item) => <CartItemRow key={item.id} item={item} onRemove={remove} />)
        )}
      </div>

      <div className="border-t border-[#e4e4e7] p-4">
        <Button
          variant="outline"
          className="w-full text-[#dc2626]"
          disabled={items.length === 0}
          onClick={clear}
        >
          Clear cart
        </Button>
      </div>
    </>
  );

  if (isDesktop) {
    if (!cartOpen) return null;
    return <aside className="flex w-[320px] flex-col border-l border-[#e4e4e7] bg-white">{content}</aside>;
  }

  return (
    <Drawer
      open={cartOpen}
      swipeDirection="right"
      onOpenChange={(open) => {
        if (open !== cartOpen) toggleCartOpen();
      }}
    >
      <DrawerContent side="right" className="w-[320px] max-w-[85vw]">
        {content}
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 4: Run the full `CartPanel` test file to verify everything passes**

Run: `npm test -- components/dashboard/CartPanel.test.tsx`
Expected: PASS (all 6 tests — the 4 original plus the 2 new ones)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/CartPanel.tsx components/dashboard/CartPanel.test.tsx
git commit -m "$(cat <<'EOF'
Make CartPanel render as a right-side drawer below lg breakpoint

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FbyJvLFUw5CRSMrCTBghMS
EOF
)"
```

---

## Task 6: `AppHeader` date and `app/dashboard/page.tsx` wiring

**Files:**
- Modify: `components/layout/AppHeader.tsx`
- Modify: `components/layout/AppHeader.test.tsx`
- Modify: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `DashboardSidebar` (Task 3), `DashboardFilters` + `SORT_LABELS` (Task 4), the now-responsive `CartPanel` (Task 5) — all with the prop shapes documented in their tasks above.
- Produces: no new exports; this task only rewires existing call sites.

- [ ] **Step 1: Add a failing test for the `AppHeader` date**

Add to `components/layout/AppHeader.test.tsx`, inside the existing `describe("AppHeader", ...)` block:

```tsx
it("hides the date below the lg breakpoint", () => {
  render(<AppHeader />);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  expect(screen.getByText(today)).toHaveClass("hidden", "lg:inline");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- components/layout/AppHeader.test.tsx`
Expected: FAIL — the date `<span>` doesn't yet carry `hidden lg:inline`

- [ ] **Step 3: Update `AppHeader.tsx`**

In `components/layout/AppHeader.tsx`, change:

```tsx
      <span className="text-sm text-[#71717a]">{today}</span>
```

to:

```tsx
      <span className="hidden text-sm text-[#71717a] lg:inline">{today}</span>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/layout/AppHeader.test.tsx`
Expected: PASS (all tests, including the new one)

- [ ] **Step 5: Rewire `app/dashboard/page.tsx`**

Replace the full file with:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { OfferGrid } from "@/components/dashboard/OfferGrid";
import { CartPanel } from "@/components/dashboard/CartPanel";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { Input } from "@/components/ui/input";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useLocationStore } from "@/lib/stores/location-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export default function DashboardPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const country = useLocationStore((s) => s.country);
  const city = useLocationStore((s) => s.city);
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);
  const searchQuery = useDashboardUiStore((s) => s.searchQuery);
  const setSearchQuery = useDashboardUiStore((s) => s.setSearchQuery);
  const showImages = useDashboardUiStore((s) => s.showImages);
  const toggleShowImages = useDashboardUiStore((s) => s.toggleShowImages);
  const sortBy = useDashboardUiStore((s) => s.sortBy);
  const setSortBy = useDashboardUiStore((s) => s.setSortBy);
  const { data, loading, error, refetch } = useDashboardData(selectedStore);

  useEffect(() => {
    if (hasHydrated && (!country || !city)) {
      router.replace("/");
    }
  }, [hasHydrated, country, city, router]);

  if (!hasHydrated || !country || !city) {
    return null;
  }

  const categories = data?.categories ?? [];
  const totalCount = data?.offers.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar categories={categories} totalCount={totalCount} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex justify-between h-[60px] flex-shrink-0 items-center border-b border-[#e4e4e7] bg-white px-6">
            <div className="relative max-w-sm w-full">
              {/* TODO: Shudcn searchbar */}
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
              <Input
                placeholder="Search products…"
                className="h-9 pl-8 pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <DashboardFilters
              showImages={showImages}
              toggleShowImages={toggleShowImages}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>
          <OfferGrid data={data} loading={loading} error={error} refetch={refetch} />
        </div>
        <CartPanel />
      </div>
    </div>
  );
}
```

Note what was removed from the old file: the `SORT_LABELS` constant (now in `DashboardFilters`), the `cartOpen`/`toggleCartOpen` reads (now internal to `CartPanel`), the inline sidebar `<div>` (now `DashboardSidebar`), the inline `Switch`/`Select` header block (now `DashboardFilters`), and the `Select`/`Switch`/`StoreList`/`CategoryList` imports (no longer used directly in this file).

- [ ] **Step 6: Run the dashboard page test file to verify it still passes unmodified**

Run: `npm test -- app/dashboard/page.test.tsx`
Expected: PASS (all existing tests, unchanged — `setDesktop(true)` from `vitest.setup.ts` keeps `DashboardSidebar`, `DashboardFilters`, and `CartPanel` all on their desktop branches, which render the same markup as the pre-refactor inline JSX)

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: PASS (every test file green)

- [ ] **Step 8: Run the typechecker and linter**

Run: `npx tsc --noEmit`
Expected: no errors

Run: `npm run lint`
Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add components/layout/AppHeader.tsx components/layout/AppHeader.test.tsx app/dashboard/page.tsx
git commit -m "$(cat <<'EOF'
Wire DashboardSidebar/Filters/CartPanel into the dashboard page

Hides the AppHeader date below lg and delegates all responsive
branching to the components introduced in prior commits, leaving
the >=1024px layout and DOM structure unchanged.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FbyJvLFUw5CRSMrCTBghMS
EOF
)"
```

---

## Task 7: Manual verification across breakpoints

**Files:** none (manual QA task, no code changes expected)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify pc (`≥1024px`)**

Open the dashboard in a browser window ≥1024px wide. Confirm: sidebar and cart panel render as static columns exactly as before, header shows the date, "Show images" switch and sort dropdown are inline in the header, no floating menu button is visible.

- [ ] **Step 3: Verify medium (`768–1023px`) and phone (`<768px`)**

Resize the browser (or use devtools device toolbar) to a width between 768–1023px, then below 768px. At both sizes, confirm: the sidebar is gone from the layout and a floating circular button appears bottom-left; clicking it opens a left-side drawer with the store list and categories, and it closes on backdrop click, swipe, or Escape. Confirm the header shows only the search input and a "Filters" icon button (no date, no inline switch/select); clicking the icon opens a popover with a working "Show images" switch and sort dropdown. Confirm clicking the existing header "Cart" button opens the cart as a right-side drawer with working item removal and "Clear cart", and that it closes the same way the sidebar drawer does.

- [ ] **Step 4: Report back**

Summarize what was checked and any visual issues found. If issues are found, fix them and re-run the affected automated tests from Tasks 1–6 before re-verifying manually.

---

## Self-Review Notes

- **Spec coverage:** Breakpoints (Task 1's `DESKTOP_QUERY`), sidebar drawer (Task 3), cart drawer (Task 5), header popover (Task 4), `AppHeader` date (Task 6), no new dependencies (Task 2 confirmed `@base-ui/react` already ships `drawer`/`popover`), manual testing (Task 7) — all spec sections are covered.
- **Placeholder scan:** no TBD/TODO markers introduced; the pre-existing `{/* TODO: Shudcn searchbar */}` comment in `app/dashboard/page.tsx` is carried over verbatim from the current file, not newly added.
- **Type consistency:** `Category`, `SortOption`, `useDashboardUiStore` field names, and `CartPanel`/`DashboardSidebar`/`DashboardFilters` prop shapes match across every task that references them.

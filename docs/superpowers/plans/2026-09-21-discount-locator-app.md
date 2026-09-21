# Discount Locator App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-screen Next.js app (location picker + store/offers/cart dashboard) that fetches real Lidl and Kaufland discounts server-side and lets a user browse/filter offers and build a cart, per `docs/superpowers/specs/2026-09-21-discount-locator-app-design.md`.

**Architecture:** Client-rendered App Router pages backed by Zustand (persisted location + cart, ephemeral UI state) and a `'use server'` unified fetch function that delegates to per-store `GroceryProvider` objects (real Lidl/Kaufland via vendor packages, stub Billa/Tesco). shadcn/ui supplies themed primitives; all visual tokens come from `specs/design spec.md`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind v4, Zustand, shadcn/ui, Vitest + React Testing Library, the local `lidl-discounts` / `kaufland-discounts` packages.

## Global Constraints

- Working directory for all app code: `C:\Users\hk\Documents\Development\react\groceries-discount\groceries-discount`.
- Vendor packages live at `scripts/lidl/ts` and `scripts/kaufland/ts`, siblings of the outer `groceries-discount/` project directory, and must be consumed via `file:` dependency, not copied. The relative path from the app's `package.json` depends on how deeply nested the app's checkout is (e.g. a plain checkout vs. a git worktree under `.claude/worktrees/<name>/`) — compute it fresh with `realpath` rather than assuming Task 5's example path is correct for your checkout; it was written for the app at its original (non-worktree) location.
- `DashboardData.store.dotColor` is always static config, never from an API response.
- Only `location` (`country` ISO code + `city`) and `cart` state persist to `localStorage`; `selectedStore`/`activeCategory`/`cartOpen` are session-only.
- `StoreName` enum values: `Lidl = 'lidl'`, `Kaufland = 'kaufland'`, `Billa = 'billa'`, `Tesco = 'tesco'`. `GroceryProvider.name` uses this enum; `GroceryProvider.fetch` is the only public method, `normalize` is private.
- Location seed data (`lib/locations.ts`) ships with Slovakia (`SK`) only, structured as an array for future entries.
- Kaufland's `COUNTRY_DOMAINS` only supports `SK`; Lidl supports `DE, AT, ES, FR, NL, PL, SK`.
- Desktop-only layout (1280–1440px); no responsive breakpoints, but layout components must not leak sizing into card/row internals.
- Every new runtime dependency goes in `dependencies`; dev/test-only tooling goes in `devDependencies`.

---

### Task 1: Test tooling + validity math (`lib/validity.ts`)

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` to devDependencies; add `"test": "vitest run"` script)
- Create: `lib/validity.ts`
- Test: `lib/validity.test.ts`

**Interfaces:**
- Produces: `computeDaysLeft(validUntil: string, now?: Date): number`, `computeRingPercent(validFrom: string, validUntil: string, now?: Date): number`, `getUrgencyColor(daysLeft: number): string` — used by every provider's `normalize` (Tasks 6–7) and by `ValidityRing`/`CartItemRow` (Tasks 11, 18).

- [ ] **Step 1: Install test tooling**

Run: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`

- [ ] **Step 2: Add Vitest config**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` `"scripts"`: `"test": "vitest run"`.

- [ ] **Step 3: Write the failing tests**

`lib/validity.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { computeDaysLeft, computeRingPercent, getUrgencyColor } from "./validity";

const NOW = new Date("2026-09-18T12:00:00.000Z");

describe("computeDaysLeft", () => {
  it("rounds up partial days remaining", () => {
    expect(computeDaysLeft("2026-09-22T00:00:00.000Z", NOW)).toBe(4);
  });

  it("clamps to 0 when validUntil is in the past", () => {
    expect(computeDaysLeft("2026-09-10T00:00:00.000Z", NOW)).toBe(0);
  });
});

describe("computeRingPercent", () => {
  const validFrom = "2026-09-15T00:00:00.000Z";
  const validUntil = "2026-09-22T00:00:00.000Z";

  it("returns 50 when now is halfway through the window", () => {
    expect(computeRingPercent(validFrom, validUntil, NOW)).toBe(50);
  });

  it("clamps to 0 when now is before validFrom", () => {
    expect(
      computeRingPercent(validFrom, validUntil, new Date("2026-09-01T00:00:00.000Z")),
    ).toBe(0);
  });

  it("clamps to 100 when now is after validUntil", () => {
    expect(
      computeRingPercent(validFrom, validUntil, new Date("2026-10-01T00:00:00.000Z")),
    ).toBe(100);
  });

  it("returns 100 for a zero-or-negative-length window", () => {
    expect(computeRingPercent(validUntil, validFrom, NOW)).toBe(100);
  });
});

describe("getUrgencyColor", () => {
  it("returns red at 1 day or fewer left", () => {
    expect(getUrgencyColor(1)).toBe("#dc2626");
    expect(getUrgencyColor(0)).toBe("#dc2626");
  });

  it("returns amber at 2-3 days left", () => {
    expect(getUrgencyColor(2)).toBe("#d97706");
    expect(getUrgencyColor(3)).toBe("#d97706");
  });

  it("returns dark for more than 3 days left", () => {
    expect(getUrgencyColor(4)).toBe("#18181b");
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run lib/validity.test.ts`
Expected: FAIL — `lib/validity.ts` does not exist / exports undefined.

- [ ] **Step 5: Implement `lib/validity.ts`**

```ts
const DAY_MS = 24 * 60 * 60 * 1000;

export function computeDaysLeft(validUntil: string, now: Date = new Date()): number {
  const diffMs = new Date(validUntil).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / DAY_MS));
}

export function computeRingPercent(
  validFrom: string,
  validUntil: string,
  now: Date = new Date(),
): number {
  const from = new Date(validFrom).getTime();
  const until = new Date(validUntil).getTime();
  const total = until - from;
  if (total <= 0) return 100;
  const elapsed = now.getTime() - from;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function getUrgencyColor(daysLeft: number): string {
  if (daysLeft <= 1) return "#dc2626";
  if (daysLeft <= 3) return "#d97706";
  return "#18181b";
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run lib/validity.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json package-lock.json lib/validity.ts lib/validity.test.ts
git commit -m "test: add Vitest tooling and validity math"
```

---

### Task 2: Location seed data (`lib/locations.ts`)

**Files:**
- Create: `lib/locations.ts`
- Test: `lib/locations.test.ts`

**Interfaces:**
- Produces: `interface Country { name: string; code: string; cities: string[] }`, `const COUNTRIES: Country[]`, `getCitiesForCountry(code: string): string[]` — used by `LocationSelectCard` (Task 12).

- [ ] **Step 1: Write the failing tests**

`lib/locations.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { COUNTRIES, getCitiesForCountry } from "./locations";

describe("COUNTRIES", () => {
  it("seeds exactly Slovakia today", () => {
    expect(COUNTRIES).toHaveLength(1);
    expect(COUNTRIES[0]).toMatchObject({ name: "Slovakia", code: "SK" });
    expect(COUNTRIES[0].cities.length).toBeGreaterThan(0);
  });
});

describe("getCitiesForCountry", () => {
  it("returns the seeded cities for a known code", () => {
    expect(getCitiesForCountry("SK")).toEqual(COUNTRIES[0].cities);
  });

  it("returns an empty array for an unknown code", () => {
    expect(getCitiesForCountry("XX")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/locations.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/locations.ts`**

```ts
export interface Country {
  name: string;
  code: string;
  cities: string[];
}

export const COUNTRIES: Country[] = [
  {
    name: "Slovakia",
    code: "SK",
    cities: [
      "Bratislava",
      "Kosice",
      "Presov",
      "Zilina",
      "Nitra",
      "Trnava",
      "Dubnica nad Vahom",
    ],
  },
];

export function getCitiesForCountry(code: string): string[] {
  return COUNTRIES.find((country) => country.code === code)?.cities ?? [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/locations.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/locations.ts lib/locations.test.ts
git commit -m "feat: seed Slovakia country/city location data"
```

---

### Task 3: Core types, provider types, stub providers, registry

**Files:**
- Create: `lib/types.ts`
- Create: `providers/types.ts`
- Create: `providers/billa.ts`
- Create: `providers/tesco.ts`
- Create: `providers/registry.ts`
- Test: `providers/registry.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `DashboardData`, `Offer`, `Category`, `Store`, `CartItem` types (`lib/types.ts`); `enum StoreName { Lidl = 'lidl', Kaufland = 'kaufland', Billa = 'billa', Tesco = 'tesco' }` and `interface GroceryProvider { name: StoreName; label: string; dotColor: string; fetch(country: string, city: string): Promise<DashboardData> }` (`providers/types.ts`); `groceryProviders: Record<StoreName, GroceryProvider>` (`providers/registry.ts`) — consumed by Tasks 6–9 and every dashboard component.

- [ ] **Step 1: Write `lib/types.ts`**

```ts
export interface Store {
  id: string;
  label: string;
  dotColor: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  categoryId: string;
  regularPrice: number;
  discountedPrice: number;
  discountPercent: number;
  validUntil: string;
  daysLeft: number;
  ringPercent: number;
}

export interface DashboardData {
  store: Store;
  categories: Category[];
  offers: Offer[];
}

export interface CartItem extends Offer {
  storeId: string;
  storeLabel: string;
  storeDotColor: string;
}
```

- [ ] **Step 2: Write `providers/types.ts`**

```ts
import type { DashboardData } from "@/lib/types";

export enum StoreName {
  Lidl = "lidl",
  Kaufland = "kaufland",
  Billa = "billa",
  Tesco = "tesco",
}

export interface GroceryProvider {
  name: StoreName;
  label: string;
  dotColor: string;
  fetch(country: string, city: string): Promise<DashboardData>;
}
```

- [ ] **Step 3: Write the failing test for stub providers + registry**

`providers/registry.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { groceryProviders } from "./registry";
import { StoreName } from "./types";

describe("groceryProviders registry", () => {
  it("has all four stores with matching name/label/dotColor", () => {
    expect(groceryProviders[StoreName.Lidl].name).toBe(StoreName.Lidl);
    expect(groceryProviders[StoreName.Kaufland].name).toBe(StoreName.Kaufland);
    expect(groceryProviders[StoreName.Billa]).toMatchObject({
      name: StoreName.Billa,
      label: "Billa",
      dotColor: "#ea580c",
    });
    expect(groceryProviders[StoreName.Tesco]).toMatchObject({
      name: StoreName.Tesco,
      label: "Tesco",
      dotColor: "#7c3aed",
    });
  });

  it("Billa and Tesco stub providers resolve empty dashboard data", async () => {
    const billaData = await groceryProviders[StoreName.Billa].fetch("SK", "Bratislava");
    expect(billaData).toEqual({
      store: { id: "billa", label: "Billa", dotColor: "#ea580c" },
      categories: [],
      offers: [],
    });

    const tescoData = await groceryProviders[StoreName.Tesco].fetch("SK", "Bratislava");
    expect(tescoData.categories).toEqual([]);
    expect(tescoData.offers).toEqual([]);
  });
});
```

Note: this test file only exercises the stub providers (Billa/Tesco). Lidl/Kaufland are added to the registry in Tasks 6–7 and get their own provider-specific tests there.

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run providers/registry.test.ts`
Expected: FAIL — `providers/registry.ts` does not exist.

- [ ] **Step 5: Implement stub providers**

`providers/billa.ts`:
```ts
import type { DashboardData } from "@/lib/types";
import { type GroceryProvider, StoreName } from "./types";

export class BillaProvider implements GroceryProvider {
  name = StoreName.Billa;
  label = "Billa";
  dotColor = "#ea580c";

  async fetch(_country: string, _city: string): Promise<DashboardData> {
    return {
      store: { id: this.name, label: this.label, dotColor: this.dotColor },
      categories: [],
      offers: [],
    };
  }
}
```

`providers/tesco.ts`:
```ts
import type { DashboardData } from "@/lib/types";
import { type GroceryProvider, StoreName } from "./types";

export class TescoProvider implements GroceryProvider {
  name = StoreName.Tesco;
  label = "Tesco";
  dotColor = "#7c3aed";

  async fetch(_country: string, _city: string): Promise<DashboardData> {
    return {
      store: { id: this.name, label: this.label, dotColor: this.dotColor },
      categories: [],
      offers: [],
    };
  }
}
```

- [ ] **Step 6: Implement a placeholder registry (Lidl/Kaufland added in Tasks 6-7)**

`providers/registry.ts`:
```ts
import { BillaProvider } from "./billa";
import { TescoProvider } from "./tesco";
import { type GroceryProvider, StoreName } from "./types";

export const groceryProviders: Record<StoreName, GroceryProvider> = {
  [StoreName.Lidl]: new BillaProvider(), // TODO(Task 6): replace with LidlProvider
  [StoreName.Kaufland]: new TescoProvider(), // TODO(Task 7): replace with KauflandProvider
  [StoreName.Billa]: new BillaProvider(),
  [StoreName.Tesco]: new TescoProvider(),
};
```

This placeholder is intentionally temporary and is fully replaced in Tasks 6–7 — it exists only so the registry (and anything importing it) type-checks and the stub-provider test above can run before the real providers exist. Task 6/7 steps overwrite this file's `Lidl`/`Kaufland` entries; nothing later depends on the placeholder values.

- [ ] **Step 7: Run test to verify it passes, then typecheck**

Run: `npx vitest run providers/registry.test.ts`
Expected: PASS (2 tests) — note the Lidl/Kaufland `name` assertions pass because the placeholder is temporarily overridden to reuse Billa/Tesco instances for `name`... **this will fail** for `groceryProviders[StoreName.Lidl].name` since a `BillaProvider` has `name = StoreName.Billa`, not `StoreName.Lidl`. Fix by giving the registry placeholder explicit inline objects instead:

```ts
import { BillaProvider } from "./billa";
import { TescoProvider } from "./tesco";
import type { DashboardData } from "@/lib/types";
import { type GroceryProvider, StoreName } from "./types";

const emptyData = (name: StoreName, label: string, dotColor: string): DashboardData => ({
  store: { id: name, label, dotColor },
  categories: [],
  offers: [],
});

// TODO(Task 6): replace with LidlProvider
const lidlPlaceholder: GroceryProvider = {
  name: StoreName.Lidl,
  label: "Lidl",
  dotColor: "#2563eb",
  fetch: async () => emptyData(StoreName.Lidl, "Lidl", "#2563eb"),
};

// TODO(Task 7): replace with KauflandProvider
const kauflandPlaceholder: GroceryProvider = {
  name: StoreName.Kaufland,
  label: "Kaufland",
  dotColor: "#dc2626",
  fetch: async () => emptyData(StoreName.Kaufland, "Kaufland", "#dc2626"),
};

export const groceryProviders: Record<StoreName, GroceryProvider> = {
  [StoreName.Lidl]: lidlPlaceholder,
  [StoreName.Kaufland]: kauflandPlaceholder,
  [StoreName.Billa]: new BillaProvider(),
  [StoreName.Tesco]: new TescoProvider(),
};
```

Update the test file's first assertion block to also check labels/colors for Lidl/Kaufland:
```ts
    expect(groceryProviders[StoreName.Lidl]).toMatchObject({ name: StoreName.Lidl, label: "Lidl", dotColor: "#2563eb" });
    expect(groceryProviders[StoreName.Kaufland]).toMatchObject({ name: StoreName.Kaufland, label: "Kaufland", dotColor: "#dc2626" });
```

Run: `npx vitest run providers/registry.test.ts`
Expected: PASS (2 tests)

Run: `npx tsc --noEmit`
Expected: no errors (confirms `lib/types.ts`/`providers/types.ts` shapes are internally consistent).

- [ ] **Step 8: Commit**

```bash
git add lib/types.ts providers/types.ts providers/billa.ts providers/tesco.ts providers/registry.ts providers/registry.test.ts
git commit -m "feat: add core types, GroceryProvider interface, Billa/Tesco stub providers"
```

---

### Task 4: Zustand stores (location, cart, dashboard UI)

**Files:**
- Modify: `package.json` (add `zustand` to dependencies)
- Create: `lib/stores/location-store.ts`
- Create: `lib/stores/cart-store.ts`
- Create: `lib/stores/dashboard-ui-store.ts`
- Test: `lib/stores/location-store.test.ts`
- Test: `lib/stores/cart-store.test.ts`
- Test: `lib/stores/dashboard-ui-store.test.ts`

**Interfaces:**
- Consumes: `CartItem` from `lib/types.ts` (Task 3), `StoreName` from `providers/types.ts` (Task 3).
- Produces: `useLocationStore()` → `{ country: string | null; city: string | null; setLocation(country: string, city: string): void; clear(): void }`; `useCartStore()` → `{ items: CartItem[]; add(item: CartItem): void; remove(offerId: string): void; clear(): void; has(offerId: string): boolean }`; `useDashboardUiStore()` → `{ selectedStore: StoreName; activeCategory: string; cartOpen: boolean; setSelectedStore(store: StoreName): void; setActiveCategory(category: string): void; toggleCartOpen(): void }`. Consumed by Tasks 12, 13, 15, 16, 18, 19.

- [ ] **Step 1: Install Zustand**

Run: `npm install zustand`

- [ ] **Step 2: Write the failing test for `location-store`**

Vitest's jsdom environment provides a real `localStorage`; clear it in `beforeEach` so tests don't leak into each other.

`lib/stores/location-store.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useLocationStore } from "./location-store";

beforeEach(() => {
  localStorage.clear();
  useLocationStore.setState({ country: null, city: null });
});

describe("useLocationStore", () => {
  it("defaults to no country/city", () => {
    expect(useLocationStore.getState()).toMatchObject({ country: null, city: null });
  });

  it("setLocation persists country and city", () => {
    useLocationStore.getState().setLocation("SK", "Bratislava");
    expect(useLocationStore.getState()).toMatchObject({ country: "SK", city: "Bratislava" });

    const stored = JSON.parse(localStorage.getItem("groceries-discount:location") ?? "{}");
    expect(stored.state).toMatchObject({ country: "SK", city: "Bratislava" });
  });

  it("clear resets to null", () => {
    useLocationStore.getState().setLocation("SK", "Bratislava");
    useLocationStore.getState().clear();
    expect(useLocationStore.getState()).toMatchObject({ country: null, city: null });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/stores/location-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `lib/stores/location-store.ts`**

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationState {
  country: string | null;
  city: string | null;
  setLocation: (country: string, city: string) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      country: null,
      city: null,
      setLocation: (country, city) => set({ country, city }),
      clear: () => set({ country: null, city: null }),
    }),
    { name: "groceries-discount:location" },
  ),
);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/stores/location-store.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Write the failing test for `cart-store`**

`lib/stores/cart-store.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cart-store";
import type { CartItem } from "@/lib/types";

const item = (id: string): CartItem => ({
  id,
  title: `Offer ${id}`,
  subtitle: "",
  categoryId: "cat-1",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
});

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
});

describe("useCartStore", () => {
  it("starts empty", () => {
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("add appends an item and has() reflects membership", () => {
    useCartStore.getState().add(item("o1"));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().has("o1")).toBe(true);
    expect(useCartStore.getState().has("o2")).toBe(false);
  });

  it("add preserves add-order across multiple items", () => {
    useCartStore.getState().add(item("o1"));
    useCartStore.getState().add(item("o2"));
    expect(useCartStore.getState().items.map((i) => i.id)).toEqual(["o1", "o2"]);
  });

  it("remove drops one item by id", () => {
    useCartStore.getState().add(item("o1"));
    useCartStore.getState().add(item("o2"));
    useCartStore.getState().remove("o1");
    expect(useCartStore.getState().items.map((i) => i.id)).toEqual(["o2"]);
  });

  it("clear empties the cart", () => {
    useCartStore.getState().add(item("o1"));
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run lib/stores/cart-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Implement `lib/stores/cart-store.ts`**

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (offerId: string) => void;
  clear: () => void;
  has: (offerId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set((state) => ({ items: [...state.items, item] })),
      remove: (offerId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== offerId) })),
      clear: () => set({ items: [] }),
      has: (offerId) => get().items.some((i) => i.id === offerId),
    }),
    { name: "groceries-discount:cart" },
  ),
);
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run lib/stores/cart-store.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 10: Write the failing test for `dashboard-ui-store`**

`lib/stores/dashboard-ui-store.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useDashboardUiStore } from "./dashboard-ui-store";
import { StoreName } from "@/providers/types";

beforeEach(() => {
  useDashboardUiStore.setState({
    selectedStore: StoreName.Lidl,
    activeCategory: "All",
    cartOpen: true,
  });
});

describe("useDashboardUiStore", () => {
  it("defaults to Lidl / All / cartOpen=true", () => {
    expect(useDashboardUiStore.getState()).toMatchObject({
      selectedStore: StoreName.Lidl,
      activeCategory: "All",
      cartOpen: true,
    });
  });

  it("setSelectedStore resets activeCategory to All", () => {
    useDashboardUiStore.getState().setActiveCategory("Bakery");
    useDashboardUiStore.getState().setSelectedStore(StoreName.Kaufland);
    expect(useDashboardUiStore.getState()).toMatchObject({
      selectedStore: StoreName.Kaufland,
      activeCategory: "All",
    });
  });

  it("toggleCartOpen flips the boolean", () => {
    useDashboardUiStore.getState().toggleCartOpen();
    expect(useDashboardUiStore.getState().cartOpen).toBe(false);
    useDashboardUiStore.getState().toggleCartOpen();
    expect(useDashboardUiStore.getState().cartOpen).toBe(true);
  });
});
```

- [ ] **Step 11: Run test to verify it fails**

Run: `npx vitest run lib/stores/dashboard-ui-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 12: Implement `lib/stores/dashboard-ui-store.ts`**

```ts
import { create } from "zustand";
import { StoreName } from "@/providers/types";

interface DashboardUiState {
  selectedStore: StoreName;
  activeCategory: string;
  cartOpen: boolean;
  setSelectedStore: (store: StoreName) => void;
  setActiveCategory: (category: string) => void;
  toggleCartOpen: () => void;
}

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  selectedStore: StoreName.Lidl,
  activeCategory: "All",
  cartOpen: true,
  setSelectedStore: (store) => set({ selectedStore: store, activeCategory: "All" }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  toggleCartOpen: () => set((state) => ({ cartOpen: !state.cartOpen })),
}));
```

- [ ] **Step 13: Run test to verify it passes**

Run: `npx vitest run lib/stores/dashboard-ui-store.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json lib/stores
git commit -m "feat: add Zustand location/cart/dashboard-ui stores"
```

---

### Task 5: Wire vendor packages (`lidl-discounts`, `kaufland-discounts`)

**Files:**
- Modify: the vendor package at `scripts/lidl/ts` (build only, no source changes — resolve its actual path per the note below)
- Modify: `package.json` (add `lidl-discounts`, `kaufland-discounts` as `file:` dependencies)
- Test: `lib/vendor-packages.test.ts`

**Interfaces:**
- Produces: working `import { LidlPlus } from "lidl-discounts"` and `import { lookupDiscounts } from "kaufland-discounts"` from within the app — consumed by Tasks 6–7.

**IMPORTANT — resolve the real path first:** `scripts/lidl/ts` and `scripts/kaufland/ts` are siblings of the outer `groceries-discount/` project directory, not of this app's `package.json`. The `file:` dependency path below must be relative to *your actual working directory* (`pwd`), which may be a git worktree nested several levels deeper than a plain checkout. Before Step 1, run: `realpath ../../../../scripts/lidl/ts` (adjust the number of `../` until it resolves to the real `scripts/lidl/ts` directory containing `package.json`/`src/`) and use that same relative path consistently in every step below in place of the literal `../scripts/lidl/ts` / `../scripts/kaufland/ts` shown here — those literals are illustrative, written for the app at its non-worktree location.

- [ ] **Step 1: Build the Lidl package**

Run (from the resolved `scripts/lidl/ts` path): `npm install && npm run build`
Expected: `scripts/lidl/ts/dist/index.js` and `dist/index.d.ts` are created.

- [ ] **Step 2: Confirm the Kaufland package is already built**

Run: `ls <resolved-path-to>/scripts/kaufland/ts/dist` (from the app directory, using the relative path you resolved above)
Expected: `index.js`, `index.d.ts` already present (committed in the provided script). If missing, run `npm install && npm run build` inside `scripts/kaufland/ts` first.

- [ ] **Step 3: Add file: dependencies and install**

Add to `package.json` `"dependencies"`, using your resolved relative path (NOT necessarily the literal `../scripts/...` shown here — see the note above):
```json
"lidl-discounts": "file:../scripts/lidl/ts",
"kaufland-discounts": "file:../scripts/kaufland/ts"
```

Run: `npm install`
Expected: `node_modules/lidl-discounts` and `node_modules/kaufland-discounts` are created (symlinked or copied by npm).

- [ ] **Step 4: Write the failing smoke test**

`lib/vendor-packages.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { LidlPlus, LidlAPIError } from "lidl-discounts";
import { lookupDiscounts, NoStoreFoundError } from "kaufland-discounts";

describe("vendor package wiring", () => {
  it("lidl-discounts exports a working LidlPlus constructor", () => {
    const client = new LidlPlus({ country: "SK" });
    expect(client.country).toBe("SK");
    expect(LidlAPIError).toBeInstanceOf(Function);
  });

  it("kaufland-discounts exports lookupDiscounts and its error classes", () => {
    expect(lookupDiscounts).toBeInstanceOf(Function);
    expect(NoStoreFoundError).toBeInstanceOf(Function);
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run lib/vendor-packages.test.ts`
Expected: FAIL — `Cannot find package 'lidl-discounts'` (before Step 3) or passes already if Step 3 was done first. Run this step before Step 3's `npm install` to confirm the failure mode, or simply proceed straight to Step 6 if Steps 1–3 are already done — the important verification is Step 6 passing.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run lib/vendor-packages.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/vendor-packages.test.ts
git commit -m "build: wire lidl-discounts and kaufland-discounts as local file: dependencies"
```

Note: `scripts/lidl/ts/dist` and `scripts/kaufland/ts/dist` are build output of packages outside this repo's app root — if `scripts/` is a separate git repo or gitignored there, no action needed here; if it's tracked and dist/ is gitignored inside `scripts/lidl/ts`, that's fine, `npm install` regenerates `node_modules/lidl-discounts` from source-controlled `dist/` only if committed. Confirm with `git -C <resolved-path-to>/scripts status` — if `scripts/lidl/ts/dist` shows as untracked and `.gitignore` there ignores `dist/`, leave it untracked (matches Kaufland's own `.gitignore` convention).

---

### Task 6: Kaufland provider (real)

**Files:**
- Modify: `providers/registry.ts` (swap in `KauflandProvider`)
- Create: `providers/kaufland.ts`
- Test: `providers/kaufland.test.ts`

**Interfaces:**
- Consumes: `lookupDiscounts`, `AmbiguousStoreError`, `NoStoreFoundError` from `kaufland-discounts` (Task 5); `GroceryProvider`, `StoreName` from `providers/types.ts` (Task 3); `computeDaysLeft`, `computeRingPercent` from `lib/validity.ts` (Task 1); `DashboardData` from `lib/types.ts` (Task 3).
- Produces: `class KauflandProvider implements GroceryProvider` — registered in `providers/registry.ts` for `StoreName.Kaufland`.

- [ ] **Step 1: Write the failing tests**

Mock the global `fetch` (which `kaufland-discounts`'s `httpGet` calls directly) to serve two responses: the store-finder JSON, then the offers-page HTML embedding a `window.SSR[...]` blob (the exact shape `extractOfferTemplate`/`buildDiscountsResponse` in `kaufland-discounts` expect).

`providers/kaufland.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { KauflandProvider } from "./kaufland";

const storeListResponse = [
  {
    n: "SK0042",
    cn: "Kaufland Bratislava",
    t: "Bratislava",
    sn: "Hlavna 1",
    pc: "81101",
    lat: "48.1486",
    lng: "17.1077",
  },
];

function offersHtml(props: unknown): string {
  return `<script>window.SSR['abc'] = ${JSON.stringify({
    component: "OfferTemplate",
    props,
  })}</script>`;
}

const offerTemplateProps = {
  weekData: { currentWeekDates: ["2026-09-15", "2026-09-21"], nextWeekDates: [] },
  offerData: {
    cycles: [
      {
        categories: [
          {
            offerCategoryId: "cat-1",
            displayName: "Bakery",
            offers: [
              {
                offerId: "o1",
                klNr: "123",
                title: "Bread",
                subtitle: "Fresh",
                unit: "1 pc",
                price: 1.5,
                formattedOldPrice: "2,00",
                discount: 25,
                dateFrom: "2026-09-15T00:00:00.000Z",
                dateTo: "2026-09-22T00:00:00.000Z",
              },
            ],
          },
        ],
      },
    ],
  },
};

function mockFetchSequence(...responses: Array<{ ok: boolean; text: () => Promise<string> }>) {
  const impl = vi.fn();
  for (const response of responses) impl.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", impl);
  return impl;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("KauflandProvider", () => {
  it("fetches a store then its offers and normalizes to DashboardData", async () => {
    mockFetchSequence(
      { ok: true, text: async () => JSON.stringify(storeListResponse) },
      { ok: true, text: async () => offersHtml(offerTemplateProps) },
    );

    const provider = new KauflandProvider();
    const data = await provider.fetch("SK", "Bratislava");

    expect(data.store).toEqual({ id: "kaufland", label: "Kaufland", dotColor: "#dc2626" });
    expect(data.categories).toEqual([{ id: "cat-1", name: "Bakery", count: 1 }]);
    expect(data.offers).toHaveLength(1);
    expect(data.offers[0]).toMatchObject({
      id: "o1",
      title: "Bread",
      subtitle: "Fresh",
      categoryId: "cat-1",
      regularPrice: 2,
      discountedPrice: 1.5,
      discountPercent: 25,
      validUntil: "2026-09-22T00:00:00.000Z",
    });
    expect(data.offers[0].daysLeft).toBeGreaterThanOrEqual(0);
    expect(data.offers[0].ringPercent).toBeGreaterThanOrEqual(0);
  });

  it("returns empty DashboardData when no store matches the city", async () => {
    mockFetchSequence({ ok: true, text: async () => JSON.stringify([]) });

    const provider = new KauflandProvider();
    const data = await provider.fetch("SK", "Nowhereville");

    expect(data).toEqual({
      store: { id: "kaufland", label: "Kaufland", dotColor: "#dc2626" },
      categories: [],
      offers: [],
    });
  });

  it("picks the first match when multiple stores match the city", async () => {
    mockFetchSequence(
      {
        ok: true,
        text: async () =>
          JSON.stringify([
            storeListResponse[0],
            { ...storeListResponse[0], n: "SK0099", cn: "Kaufland Bratislava 2" },
          ]),
      },
      { ok: true, text: async () => offersHtml(offerTemplateProps) },
    );

    const provider = new KauflandProvider();
    const data = await provider.fetch("SK", "Bratislava");

    expect(data.offers).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run providers/kaufland.test.ts`
Expected: FAIL — `providers/kaufland.ts` does not exist.

- [ ] **Step 3: Implement `providers/kaufland.ts`**

```ts
import {
  AmbiguousStoreError,
  lookupDiscounts,
  NoStoreFoundError,
  type DiscountsResponse,
} from "kaufland-discounts";
import type { DashboardData, Offer, Category } from "@/lib/types";
import { computeDaysLeft, computeRingPercent } from "@/lib/validity";
import { type GroceryProvider, StoreName } from "./types";

export class KauflandProvider implements GroceryProvider {
  name = StoreName.Kaufland;
  label = "Kaufland";
  dotColor = "#dc2626";

  async fetch(country: string, city: string): Promise<DashboardData> {
    try {
      const response = await lookupDiscounts(city, { country });
      return this.normalize(response);
    } catch (err) {
      if (err instanceof AmbiguousStoreError) {
        const response = await lookupDiscounts(city, { country, storeIndex: 0 });
        return this.normalize(response);
      }
      if (err instanceof NoStoreFoundError) {
        return this.emptyData();
      }
      throw err;
    }
  }

  private normalize(response: DiscountsResponse): DashboardData {
    const categories: Category[] = response.categories.map((c) => ({
      id: c.category_id,
      name: c.category_name,
      count: c.offer_count,
    }));

    const offers: Offer[] = response.offers.map((o) => {
      const regularPrice = o.old_price ?? o.price;
      const discountPercent =
        o.discount_percent ??
        (regularPrice > 0 ? Math.round((1 - o.price / regularPrice) * 100) : 0);
      return {
        id: o.offer_id,
        title: o.title,
        subtitle: o.subtitle ?? "",
        categoryId: o.category_id,
        regularPrice,
        discountedPrice: o.price,
        discountPercent,
        validUntil: o.valid_to,
        daysLeft: computeDaysLeft(o.valid_to),
        ringPercent: computeRingPercent(o.valid_from, o.valid_to),
      };
    });

    return {
      store: { id: this.name, label: this.label, dotColor: this.dotColor },
      categories,
      offers,
    };
  }

  private emptyData(): DashboardData {
    return { store: { id: this.name, label: this.label, dotColor: this.dotColor }, categories: [], offers: [] };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run providers/kaufland.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Register the real provider**

In `providers/registry.ts`, replace the `lidlPlaceholder`/`kauflandPlaceholder` split — for now just swap Kaufland:
```ts
import { KauflandProvider } from "./kaufland";
// ...
export const groceryProviders: Record<StoreName, GroceryProvider> = {
  [StoreName.Lidl]: lidlPlaceholder, // TODO(Task 7): replace with LidlProvider
  [StoreName.Kaufland]: new KauflandProvider(),
  [StoreName.Billa]: new BillaProvider(),
  [StoreName.Tesco]: new TescoProvider(),
};
```

- [ ] **Step 6: Run the full test suite to confirm nothing broke**

Run: `npx vitest run`
Expected: PASS (all tests so far, including `providers/registry.test.ts`)

- [ ] **Step 7: Commit**

```bash
git add providers/kaufland.ts providers/kaufland.test.ts providers/registry.ts
git commit -m "feat: add real KauflandProvider using kaufland-discounts"
```

---

### Task 7: Lidl provider (real)

**Files:**
- Modify: `providers/registry.ts` (swap in `LidlProvider`, remove `lidlPlaceholder`)
- Create: `providers/lidl.ts`
- Test: `providers/lidl.test.ts`

**Interfaces:**
- Consumes: `LidlPlus`, `LidlStoreNotFoundError` from `lidl-discounts` (Task 5); `slugify` from `kaufland-discounts` (reused rather than duplicated — it's exported from that package's public API); `GroceryProvider`, `StoreName` from `providers/types.ts`; `computeDaysLeft`, `computeRingPercent` from `lib/validity.ts`.
- Produces: `class LidlProvider implements GroceryProvider` — registered for `StoreName.Lidl`.

- [ ] **Step 1: Write the failing tests**

Mock global `fetch` to serve the autocomplete-store response, then the offers response, matching `StoreListSchema`/`OffersResponseSchema` from `lidl-discounts`.

`providers/lidl.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { LidlProvider } from "./lidl";

const storeSearchResponse = [
  { storeKey: "SK1234", name: "Lidl Bratislava", locality: "Bratislava" },
];

const offersResponse = {
  totalOffers: 1,
  offers: [
    {
      id: "off-1",
      title: "Milk",
      brand: "Rajo",
      category: "Dairy & Eggs",
      startValidityDate: "2026-09-15T00:00:00.000Z",
      endValidityDate: "2026-09-22T00:00:00.000Z",
      packaging: "1 l",
      priceBox: {
        largePartNumeric: 0.99,
        smallPartNumeric: 1.29,
      },
    },
  ],
};

function mockFetchSequence(...responses: Array<{ ok: boolean; json: () => Promise<unknown> }>) {
  const impl = vi.fn();
  for (const response of responses) impl.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", impl);
  return impl;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LidlProvider", () => {
  it("finds a store then its offers and normalizes to DashboardData", async () => {
    mockFetchSequence(
      { ok: true, json: async () => storeSearchResponse },
      { ok: true, json: async () => offersResponse },
    );

    const provider = new LidlProvider();
    const data = await provider.fetch("SK", "Bratislava");

    expect(data.store).toEqual({ id: "lidl", label: "Lidl", dotColor: "#2563eb" });
    expect(data.categories).toEqual([{ id: "dairy-eggs", name: "Dairy & Eggs", count: 1 }]);
    expect(data.offers).toHaveLength(1);
    expect(data.offers[0]).toMatchObject({
      id: "off-1",
      title: "Milk",
      categoryId: "dairy-eggs",
      regularPrice: 1.29,
      discountedPrice: 0.99,
      validUntil: "2026-09-22T00:00:00.000Z",
    });
    expect(data.offers[0].discountPercent).toBe(23);
  });

  it("returns empty DashboardData when no store matches the city", async () => {
    mockFetchSequence(
      { ok: true, json: async () => [] },
      { ok: true, json: async () => [] },
    );

    const provider = new LidlProvider();
    const data = await provider.fetch("SK", "Nowhereville");

    expect(data).toEqual({
      store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" },
      categories: [],
      offers: [],
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run providers/lidl.test.ts`
Expected: FAIL — `providers/lidl.ts` does not exist.

- [ ] **Step 3: Implement `providers/lidl.ts`**

```ts
import { LidlPlus, LidlStoreNotFoundError, type OfferData } from "lidl-discounts";
import { slugify } from "kaufland-discounts";
import type { Category, DashboardData, Offer } from "@/lib/types";
import { computeDaysLeft, computeRingPercent } from "@/lib/validity";
import { type GroceryProvider, StoreName } from "./types";

export class LidlProvider implements GroceryProvider {
  name = StoreName.Lidl;
  label = "Lidl";
  dotColor = "#2563eb";

  async fetch(country: string, city: string): Promise<DashboardData> {
    const client = new LidlPlus({ country });
    try {
      const { offers } = await client.offersForStoreSearch(city);
      return this.normalize(offers.offers);
    } catch (err) {
      if (err instanceof LidlStoreNotFoundError) {
        return this.emptyData();
      }
      throw err;
    }
  }

  private normalize(offers: OfferData[]): DashboardData {
    const categoryCounts = new Map<string, { name: string; count: number }>();
    const normalizedOffers: Offer[] = [];

    for (const offer of offers) {
      const categoryName = offer.category ?? "Other";
      const categoryId = slugify(categoryName);
      const existing = categoryCounts.get(categoryId);
      categoryCounts.set(categoryId, {
        name: categoryName,
        count: (existing?.count ?? 0) + 1,
      });

      const regularPrice = offer.priceBox?.smallPartNumeric ?? offer.priceBox?.largePartNumeric ?? 0;
      const discountedPrice = offer.priceBox?.largePartNumeric ?? 0;
      const discountPercent =
        regularPrice > 0 ? Math.round((1 - discountedPrice / regularPrice) * 100) : 0;
      const validUntil = offer.endValidityDate ?? new Date().toISOString();
      const validFrom = offer.startValidityDate ?? validUntil;

      normalizedOffers.push({
        id: offer.id ?? crypto.randomUUID(),
        title: offer.title ?? "",
        subtitle: offer.packaging ?? offer.pricePerUnit ?? "",
        categoryId,
        regularPrice,
        discountedPrice,
        discountPercent,
        validUntil,
        daysLeft: computeDaysLeft(validUntil),
        ringPercent: computeRingPercent(validFrom, validUntil),
      });
    }

    const categories: Category[] = Array.from(categoryCounts.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      count: v.count,
    }));

    return {
      store: { id: this.name, label: this.label, dotColor: this.dotColor },
      categories,
      offers: normalizedOffers,
    };
  }

  private emptyData(): DashboardData {
    return { store: { id: this.name, label: this.label, dotColor: this.dotColor }, categories: [], offers: [] };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run providers/lidl.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Register the real provider and drop the placeholder**

`providers/registry.ts` becomes:
```ts
import { BillaProvider } from "./billa";
import { KauflandProvider } from "./kaufland";
import { LidlProvider } from "./lidl";
import { TescoProvider } from "./tesco";
import { type GroceryProvider, StoreName } from "./types";

export const groceryProviders: Record<StoreName, GroceryProvider> = {
  [StoreName.Lidl]: new LidlProvider(),
  [StoreName.Kaufland]: new KauflandProvider(),
  [StoreName.Billa]: new BillaProvider(),
  [StoreName.Tesco]: new TescoProvider(),
};
```

Update `providers/registry.test.ts`'s dotColor/label assertions if needed (Lidl `#2563eb`, Kaufland `#dc2626` — already match Steps in Tasks 3/6, no change expected).

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS (all tests)

- [ ] **Step 7: Commit**

```bash
git add providers/lidl.ts providers/lidl.test.ts providers/registry.ts
git commit -m "feat: add real LidlProvider using lidl-discounts"
```

---

### Task 8: Unified fetch function (Server Action)

**Files:**
- Create: `lib/fetchDashboardData.ts`
- Test: `lib/fetchDashboardData.test.ts`

**Interfaces:**
- Consumes: `groceryProviders` from `providers/registry.ts` (Tasks 3, 6, 7); `StoreName` from `providers/types.ts`.
- Produces: `fetchDashboardData(name: StoreName, country: string, city: string): Promise<DashboardData>` — consumed by the `useDashboardData` hook (Task 16).

- [ ] **Step 1: Write the failing test**

`'use server'` functions are plain async functions at the module level and can be imported and called directly in a Vitest (non-Next-runtime) test — no server/client boundary is exercised by the unit test itself, only by Next at build/runtime.

`lib/fetchDashboardData.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { fetchDashboardData } from "./fetchDashboardData";
import { StoreName } from "@/providers/types";

describe("fetchDashboardData", () => {
  it("delegates to the Billa stub provider and returns its DashboardData", async () => {
    const data = await fetchDashboardData(StoreName.Billa, "SK", "Bratislava");
    expect(data).toEqual({
      store: { id: "billa", label: "Billa", dotColor: "#ea580c" },
      categories: [],
      offers: [],
    });
  });

  it("delegates to the Tesco stub provider and returns its DashboardData", async () => {
    const data = await fetchDashboardData(StoreName.Tesco, "SK", "Bratislava");
    expect(data.offers).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/fetchDashboardData.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/fetchDashboardData.ts`**

```ts
"use server";

import type { DashboardData } from "@/lib/types";
import { groceryProviders } from "@/providers/registry";
import type { StoreName } from "@/providers/types";

export async function fetchDashboardData(
  name: StoreName,
  country: string,
  city: string,
): Promise<DashboardData> {
  return groceryProviders[name].fetch(country, city);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/fetchDashboardData.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/fetchDashboardData.ts lib/fetchDashboardData.test.ts
git commit -m "feat: add fetchDashboardData server action"
```

---

### Task 9: shadcn/ui setup + primitives

**Files:**
- Create: `components.json` (via shadcn CLI)
- Create: `lib/utils.ts` (via shadcn CLI — provides the `cn()` classname helper shadcn's own generated primitives use internally; no other task in this plan imports it directly)
- Create: `components/ui/button.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/badge.tsx`

**Interfaces:**
- Produces: shadcn `Button`, `Select` (+ `SelectTrigger`/`SelectContent`/`SelectItem`), `Card`, `Badge` components — consumed by Tasks 11–19.

- [ ] **Step 1: Initialize shadcn/ui**

Run: `npx shadcn@latest init`

When prompted, choose: base color **Zinc** (matches the design spec's zinc neutrals), CSS variables **yes**, and accept the detected Tailwind v4 / App Router setup.

- [ ] **Step 2: Add the four primitives**

Run: `npx shadcn@latest add button select card badge`

- [ ] **Step 3: Verify the app still builds**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: PASS (all existing tests — shadcn setup doesn't touch tested code).

- [ ] **Step 4: Commit**

```bash
git add components.json components/ui lib/utils.ts package.json package-lock.json
git commit -m "chore: set up shadcn/ui with button/select/card/badge primitives"
```

---

### Task 10: App shell tokens (Inter font, background canvas color)

**IMPORTANT — this task's scope changed from its original conception.** Task 9 (shadcn init) already generated a complete, real shadcn Zinc CSS-variable theme in `app/globals.css` (oklch-based `--background`, `--foreground`, `--card`, `--primary`, `--border`, `--destructive`, `--muted-foreground`, etc., wired through a `@theme inline` block that `components/ui/*.tsx` already depend on for their Tailwind classes). **Do NOT wholesale-replace `app/globals.css`** — that would delete variable names (`--card`, `--popover`, `--muted`, `--accent`, `--input`, `--ring`, `--sidebar-*`) the Button/Select/Card/Badge components from Task 9 actually use, breaking their styling. `specs/design spec.md`'s Open Questions section itself says real shadcn tokens should replace hand-approximated hex values once available — that's now the case, so this task defers to Task 9's real Zinc values for `--foreground`/`--border`/`--primary`/`--destructive`/etc. rather than forcing the design spec's originally hand-picked hex numbers.

The one real gap: the design spec distinguishes a page "ground" color (`#fafafa`) from the card surface color (`#ffffff`), but shadcn's default Zinc theme sets `--background` to pure white (`oklch(1 0 0)`), same as `--card`. This task's only necessary change is overriding `--background` to `#fafafa` in the existing `:root` block, plus switching the font to Inter.

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css` (one value changed, nothing removed)

**Interfaces:**
- Produces: `--font-sans` bound to Inter (via next/font's `variable` matching the name `app/globals.css`'s `@theme inline` block already references); `--background` overridden to `#fafafa` — consumed visually by every component task, alongside the untouched shadcn Zinc variables from Task 9.

- [ ] **Step 1: Switch the font to Inter**

First, read the current `app/globals.css`'s `@theme inline` block (from Task 9) to see the exact font variable name it already references — as of Task 9 it's `--font-sans: var(--font-sans);` (a placeholder shadcn leaves for you to wire up). Update `app/layout.tsx` to import Inter and name its CSS variable to match that exact placeholder name (likely `--font-sans` itself, so the `@theme inline` line becomes non-circular once next/font actually defines it — if Task 9's file has a different placeholder name, use that name instead):

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Basket",
  description: "Find current grocery discounts near you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

If Task 9's `--font-mono` line in `@theme inline` still points at `var(--font-geist-mono)` (a variable this app no longer defines once Geist is removed), leave a monospace fallback in place rather than a dangling reference — either keep `Geist_Mono` imported solely for that variable, or point `--font-mono` at a system monospace stack (e.g. `ui-monospace, monospace`) directly in `globals.css`. Prefer whichever keeps the diff smaller; this app doesn't use monospace text anywhere in the design, so it's a minor loose end either way — don't spend more than a couple minutes on it.

- [ ] **Step 2: Override the background canvas color in `app/globals.css`**

In the existing `:root` block (do not touch any other variable, do not touch the `.dark` block, do not remove `--card`/`--popover`/`--muted`/`--accent`/`--input`/`--ring`/`--sidebar-*`/`--chart-*`), change only:
```css
  --background: #fafafa;
```
(replacing the line currently reading `--background: oklch(1 0 0);`). Every other line in `:root` and `.dark` stays exactly as Task 9 generated it.

Leave the rest of the file — the `@import` lines, `@custom-variant dark`, the full `@theme inline` block (aside from the font-variable fix in Step 1), `.dark`, and `@layer base` — untouched.

- [ ] **Step 3: Verify the app builds and renders**

Run: `npm run build`
Expected: build succeeds with no type or CSS errors.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "style: switch to Inter font and design-spec color tokens"
```

---

### Task 11: `ValidityRing` component

**Files:**
- Create: `components/dashboard/ValidityRing.tsx`
- Test: `components/dashboard/ValidityRing.test.tsx`

**Interfaces:**
- Consumes: `getUrgencyColor` from `lib/validity.ts` (Task 1).
- Produces: `<ValidityRing ringPercent={number} daysLeft={number} />` — consumed by `OfferCard` (Task 15).

- [ ] **Step 1: Write the failing test**

`components/dashboard/ValidityRing.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValidityRing } from "./ValidityRing";

describe("ValidityRing", () => {
  it("renders the days-left count", () => {
    render(<ValidityRing ringPercent={50} daysLeft={4} />);
    expect(screen.getByText("4d")).toBeInTheDocument();
  });

  it("uses the dark color when more than 3 days remain", () => {
    render(<ValidityRing ringPercent={50} daysLeft={4} />);
    const circle = screen.getByTestId("validity-ring-progress");
    expect(circle).toHaveAttribute("stroke", "#18181b");
  });

  it("uses red when 1 day or fewer remain", () => {
    render(<ValidityRing ringPercent={95} daysLeft={1} />);
    const circle = screen.getByTestId("validity-ring-progress");
    expect(circle).toHaveAttribute("stroke", "#dc2626");
    expect(screen.getByText("1d")).toHaveStyle({ color: "#dc2626" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/dashboard/ValidityRing.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/dashboard/ValidityRing.tsx`**

```tsx
import { getUrgencyColor } from "@/lib/validity";

interface ValidityRingProps {
  ringPercent: number;
  daysLeft: number;
}

const SIZE = 32;
const STROKE_WIDTH = 3;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ValidityRing({ ringPercent, daysLeft }: ValidityRingProps) {
  const color = getUrgencyColor(daysLeft);
  const offset = CIRCUMFERENCE * (1 - ringPercent / 100);

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          data-testid="validity-ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold"
        style={{ color }}
      >
        {daysLeft}d
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/dashboard/ValidityRing.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/ValidityRing.tsx components/dashboard/ValidityRing.test.tsx
git commit -m "feat: add ValidityRing component"
```

---

### Task 12: `LocationSelectCard` + `app/page.tsx`

**Files:**
- Create: `components/location/LocationSelectCard.tsx`
- Test: `components/location/LocationSelectCard.test.tsx`
- Modify: `app/page.tsx`
- Test: `app/page.test.tsx`

**Interfaces:**
- Consumes: `COUNTRIES`, `getCitiesForCountry` from `lib/locations.ts` (Task 2); `useLocationStore` from `lib/stores/location-store.ts` (Task 4); shadcn `Select`, `Button` (Task 9).
- Produces: `<LocationSelectCard onSubmit={(country: string, city: string) => void} />`.

- [ ] **Step 1: Write the failing test for `LocationSelectCard`**

`components/location/LocationSelectCard.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationSelectCard } from "./LocationSelectCard";

describe("LocationSelectCard", () => {
  it("disables Continue until both country and city are chosen", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LocationSelectCard onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: /city/i }));
    await user.click(await screen.findByRole("option", { name: "Bratislava" }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("calls onSubmit with the chosen country code and city on Continue", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LocationSelectCard onSubmit={onSubmit} />);

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    await user.click(screen.getByRole("combobox", { name: /city/i }));
    await user.click(await screen.findByRole("option", { name: "Bratislava" }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith("SK", "Bratislava");
  });

  it("disables the City select until a country is chosen", () => {
    render(<LocationSelectCard onSubmit={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: /city/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/location/LocationSelectCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/location/LocationSelectCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, getCitiesForCountry } from "@/lib/locations";

interface LocationSelectCardProps {
  onSubmit: (country: string, city: string) => void;
}

export function LocationSelectCard({ onSubmit }: LocationSelectCardProps) {
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const cities = country ? getCitiesForCountry(country) : [];
  const canContinue = Boolean(country && city);

  return (
    <div className="w-full max-w-[400px] rounded-xl border border-[#e4e4e7] bg-white p-7 shadow-sm flex flex-col gap-[18px]">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#18181b] text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Basket</h1>
        <p className="text-sm text-[#71717a]">Find current grocery discounts near you.</p>
      </div>

      <Select
        value={country ?? undefined}
        onValueChange={(value) => {
          setCountry(value);
          setCity(null);
        }}
      >
        <SelectTrigger aria-label="Country">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={city ?? undefined} onValueChange={setCity} disabled={!country}>
        <SelectTrigger aria-label="City">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        className="w-full"
        disabled={!canContinue}
        onClick={() => onSubmit(country as string, city as string)}
      >
        Continue
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/location/LocationSelectCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the failing test for `app/page.tsx`**

`app/page.test.tsx`:
```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { useLocationStore } from "@/lib/stores/location-store";
import Page from "./page";

beforeEach(() => {
  replace.mockClear();
  localStorage.clear();
  useLocationStore.setState({ country: null, city: null });
});

describe("Home page", () => {
  it("redirects to /dashboard when a location is already saved", () => {
    useLocationStore.setState({ country: "SK", city: "Bratislava" });
    render(<Page />);
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the location card and saves+navigates on submit", async () => {
    const user = userEvent.setup();
    render(<Page />);
    expect(replace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    await user.click(screen.getByRole("combobox", { name: /city/i }));
    await user.click(await screen.findByRole("option", { name: "Bratislava" }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(useLocationStore.getState()).toMatchObject({ country: "SK", city: "Bratislava" });
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run app/page.test.tsx`
Expected: FAIL — the default scaffold page doesn't render a location card or redirect.

- [ ] **Step 7: Implement `app/page.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocationSelectCard } from "@/components/location/LocationSelectCard";
import { useLocationStore } from "@/lib/stores/location-store";

export default function Page() {
  const router = useRouter();
  const { country, city, setLocation } = useLocationStore();

  useEffect(() => {
    if (country && city) {
      router.replace("/dashboard");
    }
  }, [country, city, router]);

  if (country && city) {
    return null;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#fafafa] p-6">
      <LocationSelectCard
        onSubmit={(selectedCountry, selectedCity) => {
          setLocation(selectedCountry, selectedCity);
          router.replace("/dashboard");
        }}
      />
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run app/page.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 9: Commit**

```bash
git add components/location/LocationSelectCard.tsx components/location/LocationSelectCard.test.tsx app/page.tsx app/page.test.tsx
git commit -m "feat: implement location-select screen"
```

---

### Task 13: `AppHeader` component

**Files:**
- Create: `components/layout/AppHeader.tsx`
- Test: `components/layout/AppHeader.test.tsx`

**Interfaces:**
- Consumes: `useCartStore` (Task 4), `useDashboardUiStore` (Task 4).
- Produces: `<AppHeader />` — rendered by `app/dashboard/page.tsx` (Task 19).

- [ ] **Step 1: Write the failing test**

`components/layout/AppHeader.test.tsx`:
```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "./AppHeader";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";

const cartItem = {
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
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
};

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({
    selectedStore: StoreName.Lidl,
    activeCategory: "All",
    cartOpen: true,
  });
});

describe("AppHeader", () => {
  it("hides the cart count badge when the cart is empty", () => {
    render(<AppHeader />);
    expect(screen.queryByTestId("cart-count-badge")).not.toBeInTheDocument();
  });

  it("shows the cart count badge when the cart has items", () => {
    useCartStore.setState({ items: [cartItem] });
    render(<AppHeader />);
    expect(screen.getByTestId("cart-count-badge")).toHaveTextContent("1");
  });

  it("toggles cartOpen when the cart button is clicked", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);
    await user.click(screen.getByRole("button", { name: /cart/i }));
    expect(useDashboardUiStore.getState().cartOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/layout/AppHeader.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/layout/AppHeader.tsx`**

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function AppHeader() {
  const itemCount = useCartStore((s) => s.items.length);
  const toggleCartOpen = useDashboardUiStore((s) => s.toggleCartOpen);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#e4e4e7] bg-white px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#18181b]" />
        <span className="text-base font-semibold">Basket</span>
      </div>

      <span className="text-sm text-[#71717a]">{today}</span>

      <Button variant="outline" onClick={toggleCartOpen} aria-label="Cart">
        Cart
        {itemCount > 0 && (
          <Badge data-testid="cart-count-badge" className="ml-2">
            {itemCount}
          </Badge>
        )}
      </Button>
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/layout/AppHeader.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/layout/AppHeader.tsx components/layout/AppHeader.test.tsx
git commit -m "feat: add AppHeader component"
```

---

### Task 14: `StoreList` + `CategoryList` components

**Files:**
- Create: `components/dashboard/StoreList.tsx`
- Test: `components/dashboard/StoreList.test.tsx`
- Create: `components/dashboard/CategoryList.tsx`
- Test: `components/dashboard/CategoryList.test.tsx`

**Interfaces:**
- Consumes: `groceryProviders` (Task 3/6/7), `useDashboardUiStore` (Task 4), `Category` type (Task 3).
- Produces: `<StoreList />` (reads/writes `selectedStore` itself); `<CategoryList categories={Category[]} totalCount={number} />` — consumed by `app/dashboard/page.tsx` (Task 19).

- [ ] **Step 1: Write the failing test for `StoreList`**

`components/dashboard/StoreList.test.tsx`:
```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoreList } from "./StoreList";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";

beforeEach(() => {
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
});

describe("StoreList", () => {
  it("renders all four stores", () => {
    render(<StoreList />);
    expect(screen.getByRole("button", { name: /lidl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kaufland/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /billa/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tesco/i })).toBeInTheDocument();
  });

  it("selecting a store updates selectedStore and resets activeCategory", async () => {
    const user = userEvent.setup();
    useDashboardUiStore.setState({ activeCategory: "Bakery" });
    render(<StoreList />);
    await user.click(screen.getByRole("button", { name: /kaufland/i }));
    expect(useDashboardUiStore.getState()).toMatchObject({
      selectedStore: StoreName.Kaufland,
      activeCategory: "All",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/dashboard/StoreList.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/dashboard/StoreList.tsx`**

```tsx
"use client";

import { groceryProviders } from "@/providers/registry";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function StoreList() {
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);
  const setSelectedStore = useDashboardUiStore((s) => s.setSelectedStore);

  return (
    <div className="flex flex-col gap-1 p-3">
      {Object.values(groceryProviders).map((provider) => {
        const active = provider.name === selectedStore;
        return (
          <button
            key={provider.name}
            type="button"
            onClick={() => setSelectedStore(provider.name)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
              active ? "bg-[#f4f4f5] border border-[#e4e4e7]" : "border border-transparent"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: provider.dotColor }}
            />
            {provider.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/dashboard/StoreList.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the failing test for `CategoryList`**

`components/dashboard/CategoryList.test.tsx`:
```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryList } from "./CategoryList";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";

const categories = [
  { id: "bakery", name: "Bakery", count: 3 },
  { id: "dairy", name: "Dairy & Eggs", count: 2 },
];

beforeEach(() => {
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
});

describe("CategoryList", () => {
  it("renders an All row with the total count plus each category", () => {
    render(<CategoryList categories={categories} totalCount={5} />);
    expect(screen.getByRole("button", { name: /all/i })).toHaveTextContent("5");
    expect(screen.getByRole("button", { name: /bakery/i })).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: /dairy & eggs/i })).toHaveTextContent("2");
  });

  it("selecting a category updates activeCategory", async () => {
    const user = userEvent.setup();
    render(<CategoryList categories={categories} totalCount={5} />);
    await user.click(screen.getByRole("button", { name: /bakery/i }));
    expect(useDashboardUiStore.getState().activeCategory).toBe("bakery");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run components/dashboard/CategoryList.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `components/dashboard/CategoryList.tsx`**

```tsx
"use client";

import type { Category } from "@/lib/types";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

interface CategoryListProps {
  categories: Category[];
  totalCount: number;
}

export function CategoryList({ categories, totalCount }: CategoryListProps) {
  const activeCategory = useDashboardUiStore((s) => s.activeCategory);
  const setActiveCategory = useDashboardUiStore((s) => s.setActiveCategory);

  const rows = [{ id: "All", name: "All", count: totalCount }, ...categories];

  return (
    <div className="flex flex-col gap-1 p-3">
      {rows.map((row) => {
        const active = row.id === activeCategory;
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => setActiveCategory(row.id)}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
              active ? "bg-[#f4f4f5] border border-[#e4e4e7]" : "border border-transparent"
            }`}
          >
            <span>{row.name}</span>
            <span className="text-[#a1a1aa]">{row.count}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run components/dashboard/CategoryList.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 9: Commit**

```bash
git add components/dashboard/StoreList.tsx components/dashboard/StoreList.test.tsx components/dashboard/CategoryList.tsx components/dashboard/CategoryList.test.tsx
git commit -m "feat: add StoreList and CategoryList components"
```

---

### Task 15: `OfferCard` component

**Files:**
- Create: `components/dashboard/OfferCard.tsx`
- Test: `components/dashboard/OfferCard.test.tsx`

**Interfaces:**
- Consumes: `Offer` type (Task 3), `ValidityRing` (Task 11), `useCartStore` (Task 4).
- Produces: `<OfferCard offer={Offer} storeId={string} storeLabel={string} storeDotColor={string} />` — consumed by `OfferGrid` (Task 17).

- [ ] **Step 1: Write the failing test**

`components/dashboard/OfferCard.test.tsx`:
```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferCard } from "./OfferCard";
import { useCartStore } from "@/lib/stores/cart-store";

const offer = {
  id: "o1",
  title: "Milk",
  subtitle: "1 l",
  categoryId: "dairy",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
};

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
});

describe("OfferCard", () => {
  it("shows price, discount pill, and an outline Add to cart button when not in cart", () => {
    render(<OfferCard offer={offer} storeId="lidl" storeLabel="Lidl" storeDotColor="#2563eb" />);
    expect(screen.getByText("-50%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("adds the offer to the cart on click and flips to In cart", async () => {
    const user = userEvent.setup();
    render(<OfferCard offer={offer} storeId="lidl" storeLabel="Lidl" storeDotColor="#2563eb" />);
    await user.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]).toMatchObject({ id: "o1", storeId: "lidl" });
    expect(screen.getByRole("button", { name: /in cart/i })).toBeInTheDocument();
  });

  it("removes the offer from the cart when clicked again", async () => {
    const user = userEvent.setup();
    render(<OfferCard offer={offer} storeId="lidl" storeLabel="Lidl" storeDotColor="#2563eb" />);
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await user.click(screen.getByRole("button", { name: /in cart/i }));

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/dashboard/OfferCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/dashboard/OfferCard.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { ValidityRing } from "@/components/dashboard/ValidityRing";
import { useCartStore } from "@/lib/stores/cart-store";
import type { Offer } from "@/lib/types";

interface OfferCardProps {
  offer: Offer;
  storeId: string;
  storeLabel: string;
  storeDotColor: string;
}

export function OfferCard({ offer, storeId, storeLabel, storeDotColor }: OfferCardProps) {
  const inCart = useCartStore((s) => s.has(offer.id));
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);

  return (
    <div className="flex flex-col gap-[10px] rounded-xl border border-[#e4e4e7] bg-white p-[14px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: storeDotColor }} />
          {storeLabel}
        </div>
        <ValidityRing ringPercent={offer.ringPercent} daysLeft={offer.daysLeft} />
      </div>

      <div>
        <p className="text-sm font-semibold">{offer.title}</p>
        <p className="text-xs text-[#71717a]">{offer.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#a1a1aa] line-through">
          {offer.regularPrice.toFixed(2)}
        </span>
        <span className="text-lg font-bold">{offer.discountedPrice.toFixed(2)}</span>
        <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
          -{offer.discountPercent}%
        </span>
      </div>

      <p className="text-[11px] text-[#a1a1aa]">
        Valid until {new Date(offer.validUntil).toLocaleDateString()}
      </p>

      <Button
        variant={inCart ? "default" : "outline"}
        className="w-full"
        onClick={() =>
          inCart
            ? remove(offer.id)
            : add({ ...offer, storeId, storeLabel, storeDotColor })
        }
      >
        {inCart ? "In cart" : "Add to cart"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/dashboard/OfferCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/OfferCard.tsx components/dashboard/OfferCard.test.tsx
git commit -m "feat: add OfferCard component"
```

---

### Task 16: `useDashboardData` hook

**Files:**
- Create: `hooks/useDashboardData.ts`
- Test: `hooks/useDashboardData.test.ts`

**Interfaces:**
- Consumes: `fetchDashboardData` (Task 8), `useLocationStore` (Task 4), `StoreName` (Task 3).
- Produces: `useDashboardData(storeName: StoreName): { data: DashboardData | null; loading: boolean; error: Error | null; refetch: () => void }` — consumed by `OfferGrid` (Task 17) / `app/dashboard/page.tsx` (Task 19).

- [ ] **Step 1: Write the failing test**

Mock `@/lib/fetchDashboardData` so the hook's own loading/error/refetch logic is tested in isolation from any real provider.

`hooks/useDashboardData.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDashboardData } from "./useDashboardData";
import { useLocationStore } from "@/lib/stores/location-store";
import { StoreName } from "@/providers/types";

const fetchDashboardData = vi.fn();
vi.mock("@/lib/fetchDashboardData", () => ({
  fetchDashboardData: (...args: unknown[]) => fetchDashboardData(...args),
}));

const sampleData = {
  store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" },
  categories: [],
  offers: [],
};

beforeEach(() => {
  fetchDashboardData.mockReset();
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
});

describe("useDashboardData", () => {
  it("starts loading, then resolves with data", async () => {
    fetchDashboardData.mockResolvedValueOnce(sampleData);
    const { result } = renderHook(() => useDashboardData(StoreName.Lidl));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(sampleData);
    expect(result.current.error).toBeNull();
    expect(fetchDashboardData).toHaveBeenCalledWith(StoreName.Lidl, "SK", "Bratislava");
  });

  it("sets error when the fetch rejects", async () => {
    fetchDashboardData.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useDashboardData(StoreName.Lidl));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeNull();
  });

  it("refetches when storeName changes", async () => {
    fetchDashboardData.mockResolvedValue(sampleData);
    const { result, rerender } = renderHook(
      ({ store }) => useDashboardData(store),
      { initialProps: { store: StoreName.Lidl } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ store: StoreName.Kaufland });
    await waitFor(() => expect(fetchDashboardData).toHaveBeenCalledWith(StoreName.Kaufland, "SK", "Bratislava"));
  });

  it("refetch() re-runs the fetch", async () => {
    fetchDashboardData.mockResolvedValue(sampleData);
    const { result } = renderHook(() => useDashboardData(StoreName.Lidl));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.refetch());
    await waitFor(() => expect(fetchDashboardData).toHaveBeenCalledTimes(2));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run hooks/useDashboardData.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `hooks/useDashboardData.ts`**

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDashboardData } from "@/lib/fetchDashboardData";
import { useLocationStore } from "@/lib/stores/location-store";
import type { DashboardData } from "@/lib/types";
import type { StoreName } from "@/providers/types";

interface UseDashboardDataResult {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDashboardData(storeName: StoreName): UseDashboardDataResult {
  const country = useLocationStore((s) => s.country);
  const city = useLocationStore((s) => s.city);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!country || !city) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDashboardData(storeName, country, city)
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData(null);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storeName, country, city, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, error, refetch };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run hooks/useDashboardData.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add hooks/useDashboardData.ts hooks/useDashboardData.test.ts
git commit -m "feat: add useDashboardData hook"
```

---

### Task 17: `OfferGrid` component

**Files:**
- Create: `components/dashboard/OfferGrid.tsx`
- Test: `components/dashboard/OfferGrid.test.tsx`

**Interfaces:**
- Consumes: `useDashboardData` (Task 16), `useDashboardUiStore` (Task 4), `OfferCard` (Task 15).
- Produces: `<OfferGrid />` — consumed by `app/dashboard/page.tsx` (Task 19).

- [ ] **Step 1: Write the failing test**

`components/dashboard/OfferGrid.test.tsx`:
```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferGrid } from "./OfferGrid";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";

const useDashboardData = vi.fn();
vi.mock("@/hooks/useDashboardData", () => ({
  useDashboardData: (...args: unknown[]) => useDashboardData(...args),
}));

const offer = (id: string, categoryId: string) => ({
  id,
  title: `Offer ${id}`,
  subtitle: "",
  categoryId,
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
});

beforeEach(() => {
  useDashboardData.mockReset();
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
});

describe("OfferGrid", () => {
  it("shows a loading state", () => {
    useDashboardData.mockReturnValue({ data: null, loading: true, error: null, refetch: vi.fn() });
    render(<OfferGrid />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows an error state with a retry button", async () => {
    const refetch = vi.fn();
    useDashboardData.mockReturnValue({ data: null, loading: false, error: new Error("boom"), refetch });
    const user = userEvent.setup();
    render(<OfferGrid />);
    expect(screen.getByText(/couldn't load offers/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows an empty state when there are no offers", () => {
    useDashboardData.mockReturnValue({
      data: { store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" }, categories: [], offers: [] },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<OfferGrid />);
    expect(screen.getByText(/no offers/i)).toBeInTheDocument();
  });

  it("filters offers by the active category", () => {
    useDashboardData.mockReturnValue({
      data: {
        store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" },
        categories: [{ id: "bakery", name: "Bakery", count: 1 }, { id: "dairy", name: "Dairy", count: 1 }],
        offers: [offer("o1", "bakery"), offer("o2", "dairy")],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    useDashboardUiStore.setState({ activeCategory: "bakery" });
    render(<OfferGrid />);
    expect(screen.getByText("Offer o1")).toBeInTheDocument();
    expect(screen.queryByText("Offer o2")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/dashboard/OfferGrid.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/dashboard/OfferGrid.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { OfferCard } from "@/components/dashboard/OfferCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function OfferGrid() {
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);
  const activeCategory = useDashboardUiStore((s) => s.activeCategory);
  const { data, loading, error, refetch } = useDashboardData(selectedStore);

  if (loading) {
    return <p className="p-6 text-sm text-[#71717a]">Loading offers…</p>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 p-6">
        <p className="text-sm text-[#71717a]">Couldn&apos;t load offers. Please try again.</p>
        <Button variant="outline" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  const offers = data?.offers ?? [];
  const filtered =
    activeCategory === "All" ? offers : offers.filter((o) => o.categoryId === activeCategory);

  if (filtered.length === 0) {
    return (
      <p className="p-6 text-sm text-[#71717a]">
        No offers {activeCategory === "All" ? "" : "in this category "}at {data?.store.label}.
      </p>
    );
  }

  return (
    <div className="p-6">
      <p className="mb-4 text-sm text-[#71717a]">
        {filtered.length} offers at {data?.store.label}
      </p>
      <div className="grid grid-cols-3 gap-5">
        {filtered.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            storeId={data!.store.id}
            storeLabel={data!.store.label}
            storeDotColor={data!.store.dotColor}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/dashboard/OfferGrid.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/OfferGrid.tsx components/dashboard/OfferGrid.test.tsx
git commit -m "feat: add OfferGrid with loading/error/empty states"
```

---

### Task 18: `CartItemRow` + `CartPanel` components

**Files:**
- Create: `components/dashboard/CartItemRow.tsx`
- Test: `components/dashboard/CartItemRow.test.tsx`
- Create: `components/dashboard/CartPanel.tsx`
- Test: `components/dashboard/CartPanel.test.tsx`

**Interfaces:**
- Consumes: `useCartStore` (Task 4), `useDashboardUiStore` (Task 4), `getUrgencyColor` (Task 1), `CartItem` type (Task 3).
- Produces: `<CartPanel />` — consumed by `app/dashboard/page.tsx` (Task 19).

- [ ] **Step 1: Write the failing test for `CartItemRow`**

`components/dashboard/CartItemRow.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartItemRow } from "./CartItemRow";

const item = {
  id: "o1",
  title: "Milk",
  subtitle: "1 l",
  categoryId: "dairy",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 1,
  ringPercent: 95,
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
};

describe("CartItemRow", () => {
  it("renders title, store, and price details", () => {
    render(<CartItemRow item={item} onRemove={vi.fn()} />);
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.getByText("Lidl")).toBeInTheDocument();
    expect(screen.getByText("-50%")).toBeInTheDocument();
  });

  it("uses urgency red for a 1-day-left item's valid-until text", () => {
    render(<CartItemRow item={item} onRemove={vi.fn()} />);
    expect(screen.getByTestId("cart-item-valid-until")).toHaveStyle({ color: "#dc2626" });
  });

  it("calls onRemove with the item id", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<CartItemRow item={item} onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith("o1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/dashboard/CartItemRow.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/dashboard/CartItemRow.tsx`**

```tsx
"use client";

import { getUrgencyColor } from "@/lib/validity";
import type { CartItem } from "@/lib/types";

interface CartItemRowProps {
  item: CartItem;
  onRemove: (offerId: string) => void;
}

export function CartItemRow({ item, onRemove }: CartItemRowProps) {
  const urgencyColor = getUrgencyColor(item.daysLeft);

  return (
    <div className="flex items-start gap-3 border-b border-[#e4e4e7] py-3">
      <div className="h-11 w-11 flex-shrink-0 rounded-[6px] bg-[#f4f4f5]" />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-[#71717a]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.storeDotColor }} />
          {item.storeLabel}
        </div>
        <p className="text-sm font-medium">{item.title}</p>
        <p data-testid="cart-item-valid-until" className="text-xs" style={{ color: urgencyColor }}>
          Valid until {new Date(item.validUntil).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{item.discountedPrice.toFixed(2)}</p>
        <p className="text-xs text-[#a1a1aa] line-through">{item.regularPrice.toFixed(2)}</p>
        <p className="text-xs font-semibold text-[#15803d]">-{item.discountPercent}%</p>
      </div>
      <button type="button" aria-label="Remove" onClick={() => onRemove(item.id)} className="text-[#a1a1aa]">
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/dashboard/CartItemRow.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the failing test for `CartPanel`**

`components/dashboard/CartPanel.test.tsx`:
```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartPanel } from "./CartPanel";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";

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
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
};

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
});

describe("CartPanel", () => {
  it("shows an empty state and a disabled Clear cart button when empty", () => {
    render(<CartPanel />);
    expect(screen.getByText(/no items/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear cart/i })).toBeDisabled();
  });

  it("lists items and lets Clear cart empty the store", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [item] });
    render(<CartPanel />);
    expect(screen.getByText("Cart · 1")).toBeInTheDocument();
    expect(screen.getByText("Milk")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear cart/i }));
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("removing an item via its row updates the cart", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [item] });
    render(<CartPanel />);
    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("the close button toggles cartOpen off", async () => {
    const user = userEvent.setup();
    render(<CartPanel />);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(useDashboardUiStore.getState().cartOpen).toBe(false);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run components/dashboard/CartPanel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `components/dashboard/CartPanel.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { CartItemRow } from "@/components/dashboard/CartItemRow";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function CartPanel() {
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const toggleCartOpen = useDashboardUiStore((s) => s.toggleCartOpen);

  return (
    <aside className="flex w-[320px] flex-col border-l border-[#e4e4e7] bg-white">
      <div className="flex items-center justify-between border-b border-[#e4e4e7] p-4">
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
    </aside>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run components/dashboard/CartPanel.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 9: Commit**

```bash
git add components/dashboard/CartItemRow.tsx components/dashboard/CartItemRow.test.tsx components/dashboard/CartPanel.tsx components/dashboard/CartPanel.test.tsx
git commit -m "feat: add CartItemRow and CartPanel components"
```

---

### Task 19: `app/dashboard/page.tsx` — wire the 3-pane layout

**Files:**
- Create: `app/dashboard/page.tsx`
- Test: `app/dashboard/page.test.tsx`

**Interfaces:**
- Consumes: `AppHeader` (13), `StoreList` (14), `CategoryList` (14), `OfferGrid` (17), `CartPanel` (18), `useLocationStore` (4), `useDashboardUiStore` (4), `useDashboardData` (16).

- [ ] **Step 1: Write the failing test**

Mock `useDashboardData` (as in Task 17) so this test exercises page-level wiring (redirect guard, category derivation, cart-panel visibility) without needing real provider data.

`app/dashboard/page.test.tsx`:
```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const useDashboardData = vi.fn();
vi.mock("@/hooks/useDashboardData", () => ({
  useDashboardData: (...args: unknown[]) => useDashboardData(...args),
}));

import { useLocationStore } from "@/lib/stores/location-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";
import DashboardPage from "./page";

beforeEach(() => {
  replace.mockClear();
  localStorage.clear();
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
  useDashboardData.mockReturnValue({
    data: {
      store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" },
      categories: [{ id: "bakery", name: "Bakery", count: 1 }],
      offers: [
        {
          id: "o1",
          title: "Bread",
          subtitle: "",
          categoryId: "bakery",
          regularPrice: 2,
          discountedPrice: 1,
          discountPercent: 50,
          validUntil: "2026-09-22T00:00:00.000Z",
          daysLeft: 4,
          ringPercent: 50,
        },
      ],
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe("Dashboard page", () => {
  it("redirects to / when no location is saved", () => {
    useLocationStore.setState({ country: null, city: null });
    render(<DashboardPage />);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("renders stores, categories, offers, and the cart panel", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("button", { name: /lidl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bakery/i })).toBeInTheDocument();
    expect(screen.getByText("Bread")).toBeInTheDocument();
    expect(screen.getByText("Cart · 0")).toBeInTheDocument();
  });

  it("hides the cart panel when cartOpen is false", () => {
    useDashboardUiStore.setState({ cartOpen: false });
    render(<DashboardPage />);
    expect(screen.queryByText(/cart ·/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/dashboard/page.test.tsx`
Expected: FAIL — `app/dashboard/page.tsx` does not exist.

- [ ] **Step 3: Implement `app/dashboard/page.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { StoreList } from "@/components/dashboard/StoreList";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { OfferGrid } from "@/components/dashboard/OfferGrid";
import { CartPanel } from "@/components/dashboard/CartPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLocationStore } from "@/lib/stores/location-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export default function DashboardPage() {
  const router = useRouter();
  const country = useLocationStore((s) => s.country);
  const city = useLocationStore((s) => s.city);
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);
  const cartOpen = useDashboardUiStore((s) => s.cartOpen);
  const { data } = useDashboardData(selectedStore);

  useEffect(() => {
    if (!country || !city) {
      router.replace("/");
    }
  }, [country, city, router]);

  if (!country || !city) {
    return null;
  }

  const categories = data?.categories ?? [];
  const totalCount = data?.offers.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[240px] overflow-y-auto border-r border-[#e4e4e7] bg-white">
          <StoreList />
          <CategoryList categories={categories} totalCount={totalCount} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <OfferGrid />
        </div>
        {cartOpen && <CartPanel />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/dashboard/page.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS (every test file written in Tasks 1–19)

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/page.tsx app/dashboard/page.test.tsx
git commit -m "feat: wire dashboard 3-pane layout"
```

---

### Task 20: Manual verification (real network calls)

No automated test in this task — it exercises the one thing Vitest can't: real HTTP calls to the live Lidl and Kaufland endpoints from inside Next's dev server. This is the acceptance check for the whole plan.

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (leave running)

- [ ] **Step 2: Walk the location-select screen**

Open `http://localhost:3000`. Confirm: brand card is centered, Continue is disabled, selecting Slovakia enables the City select, selecting Bratislava enables Continue, clicking Continue navigates to `/dashboard`.

- [ ] **Step 3: Reload at `/`**

Navigate back to `http://localhost:3000/`. Confirm it immediately redirects to `/dashboard` (location already in localStorage) with no flash of the location card.

- [ ] **Step 4: Verify real Lidl data**

On the dashboard, confirm Lidl is selected by default and the center grid shows real offers fetched from the live Lidl Plus API for Bratislava (titles/prices that look like real products, not the test fixtures) — confirms Task 7's server-side fetch works end-to-end through the Next dev server. Check at least one card's validity ring and days-left count render.

- [ ] **Step 5: Verify real Kaufland data**

Click Kaufland in the left rail. Confirm the category list updates and real offers load (or, if no Kaufland store matches Bratislava at the time of testing, confirm the empty state renders instead of an error/crash).

- [ ] **Step 6: Verify Billa/Tesco empty states**

Click Billa, then Tesco. Confirm each shows the "No offers" empty state, not an error.

- [ ] **Step 7: Exercise the cart**

Add 2–3 offers to the cart from different categories/stores. Confirm: cart badge count updates in the header, cart panel lists each item with correct urgency-colored "Valid until" text, removing one item via its row works, "Clear cart" empties it and becomes disabled again.

- [ ] **Step 8: Verify persistence**

Reload the page. Confirm the cart items and Country/City selection survive the reload (read from `localStorage`).

- [ ] **Step 9: Note any live-data issues**

If step 4 or 5 fails because of a live upstream change (e.g. Lidl/Kaufland changed their response shape), note the exact error in a follow-up task rather than silently reverting provider code — this plan's provider tests (Tasks 6–7) are fixture-based and won't catch upstream drift.

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-09-21-discount-locator-app-design.md` maps to at least one task — tech stack (Tasks 1, 4, 5, 9), data layer/providers (Tasks 2, 3, 6, 7, 8), screens (Tasks 12, 19), components (Tasks 11, 13–18), state model (Task 4), design tokens (Task 10). The design doc's "explicitly out of scope" items (mobile layout, real Billa/Tesco data, a Kaufland store-picker UI, non-SK countries) have no tasks, by design.
- **Placeholder scan:** the only intentional placeholder is the temporary `lidlPlaceholder`/`kauflandPlaceholder` objects in Task 3 Step 7, which Tasks 6–7 explicitly overwrite in their own Step 5 — flagged inline both places so it can't be missed.
- **Type consistency:** `DashboardData`/`Offer`/`Category`/`Store`/`CartItem` (Task 3) are used with identical field names across Tasks 6, 7, 8, 11, 12, 15–19 — `CartItem` always carries `storeId`/`storeLabel`/`storeDotColor` alongside the base `Offer` fields, and every component consuming it (OfferCard's add-to-cart call, CartItemRow, CartPanel) uses those exact three field names. `StoreName` enum values (`'lidl' | 'kaufland' | 'billa' | 'tesco'`) are used consistently as both registry keys and `DashboardData.store.id` values throughout.


# Geoapify City Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Slovakia-only city dropdown with a live Geoapify-backed autocomplete textfield, and let users change their saved Country/City from the dashboard via a reusable modal.

**Architecture:** A `'use server'` action calls the Geoapify Autocomplete API server-side (keeping the API key off the client) and returns plain city-name strings. A new `CityAutocomplete` component debounces user input 400ms and calls that action, replacing the City `Select` inside `LocationSelectCard`. A new `ChangeLocationDialog` reuses `LocationSelectCard` inside a `Dialog`, opened from a new button in `AppHeader`.

**Tech Stack:** Next.js Server Actions, React 19, `@base-ui/react/dialog`, Zustand (`useLocationStore`), Vitest + React Testing Library.

## Global Constraints

- Country stays a fixed `Select` dropdown sourced from `lib/locations.ts` `COUNTRIES` — do not add country autocomplete or new countries.
- City search must go through a Server Action (`'use server'`), never a client-side `fetch` to Geoapify — the API key must never reach the browser.
- Debounce all city search input by exactly 400ms.
- Selecting a location from the dashboard's change-location dialog must `setLocation(...)` then `router.replace("/dashboard")` — a full navigation, not an in-place refetch.
- The "Change location" trigger lives in `AppHeader`, next to the `Cart` button.
- Geoapify request failures (non-OK response, thrown fetch, missing `GEOAPIFY_API_KEY`) must resolve to `[]`, never throw into the UI.

---

### Task 1: `searchCities` server action

**Files:**
- Create: `lib/actions/searchCities.ts`
- Test: `lib/actions/searchCities.test.ts`
- Create: `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `searchCities(query: string, countryCode: string): Promise<string[]>` — later tasks (CityAutocomplete) call this directly.

- [ ] **Step 1: Write the failing tests**

Create `lib/actions/searchCities.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchCities } from "./searchCities";

const originalFetch = global.fetch;
const originalApiKey = process.env.GEOAPIFY_API_KEY;

beforeEach(() => {
  process.env.GEOAPIFY_API_KEY = "test-key";
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalApiKey === undefined) {
    delete process.env.GEOAPIFY_API_KEY;
  } else {
    process.env.GEOAPIFY_API_KEY = originalApiKey;
  }
  vi.restoreAllMocks();
});

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("searchCities", () => {
  it("returns [] without calling fetch when the query is shorter than 2 characters", async () => {
    global.fetch = vi.fn();
    const result = await searchCities("A", "SK");
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns [] without calling fetch when GEOAPIFY_API_KEY is missing", async () => {
    delete process.env.GEOAPIFY_API_KEY;
    global.fetch = vi.fn();
    const result = await searchCities("Trenc", "SK");
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("maps and dedupes city names from a successful response", async () => {
    mockFetchOnce({
      features: [
        { properties: { city: "Trencin" } },
        { properties: { city: "Trencin" } },
        { properties: { city: "Trencianske Teplice" } },
        { properties: {} },
      ],
    });

    const result = await searchCities("Trenc", "SK");

    expect(result).toEqual(["Trencin", "Trencianske Teplice"]);
  });

  it("calls Geoapify with the query, country filter, and api key", async () => {
    mockFetchOnce({ features: [] });

    await searchCities("Trenc", "SK");

    const calledUrl = (global.fetch as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain("https://api.geoapify.com/v1/geocode/autocomplete");
    expect(calledUrl).toContain("text=Trenc");
    expect(calledUrl).toContain("type=city");
    expect(calledUrl).toContain("filter=countrycode:SK");
    expect(calledUrl).toContain("apiKey=test-key");
  });

  it("returns [] when the response is not ok", async () => {
    mockFetchOnce({ features: [{ properties: { city: "Trencin" } }] }, false);
    const result = await searchCities("Trenc", "SK");
    expect(result).toEqual([]);
  });

  it("returns [] when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    const result = await searchCities("Trenc", "SK");
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/actions/searchCities.test.ts`
Expected: FAIL with "Cannot find module './searchCities'" (or similar — the file doesn't exist yet).

- [ ] **Step 3: Implement `searchCities`**

Create `lib/actions/searchCities.ts`:

```ts
"use server";

interface GeoapifyFeature {
  properties?: {
    city?: string;
  };
}

interface GeoapifyAutocompleteResponse {
  features?: GeoapifyFeature[];
}

export async function searchCities(query: string, countryCode: string): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return [];
  }

  const url =
    `https://api.geoapify.com/v1/geocode/autocomplete` +
    `?text=${encodeURIComponent(trimmed)}` +
    `&type=city` +
    `&filter=countrycode:${encodeURIComponent(countryCode)}` +
    `&apiKey=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as GeoapifyAutocompleteResponse;
  const cities = (data.features ?? [])
    .map((feature) => feature.properties?.city)
    .filter((city): city is string => Boolean(city));

  return Array.from(new Set(cities));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/actions/searchCities.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Add `.env.example` and un-ignore it**

Create `.env.example`:

```
GEOAPIFY_API_KEY=
```

In `.gitignore`, change:

```
# env files (can opt-in for committing if needed)
.env*
```

to:

```
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

- [ ] **Step 6: Commit**

```bash
git add lib/actions/searchCities.ts lib/actions/searchCities.test.ts .env.example .gitignore
git commit -m "feat: add searchCities server action for Geoapify city lookup"
```

---

### Task 2: `CityAutocomplete` component

**Files:**
- Create: `components/location/CityAutocomplete.tsx`
- Test: `components/location/CityAutocomplete.test.tsx`

**Interfaces:**
- Consumes: `searchCities(query: string, countryCode: string): Promise<string[]>` from `lib/actions/searchCities.ts` (Task 1).
- Produces:
  ```ts
  interface CityAutocompleteProps {
    countryCode: string | null;
    value: string | null;
    onChange: (city: string | null) => void;
  }
  function CityAutocomplete(props: CityAutocompleteProps): JSX.Element
  ```
  Renders an `<input>` with `role="combobox"` and `aria-label="City"`, disabled when `countryCode` is `null`. Later tasks (`LocationSelectCard`) render it in place of the old city `Select`.

- [ ] **Step 1: Write the failing tests**

Create `components/location/CityAutocomplete.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CityAutocomplete } from "./CityAutocomplete";
import { searchCities } from "@/lib/actions/searchCities";

vi.mock("@/lib/actions/searchCities", () => ({
  searchCities: vi.fn(),
}));

const mockedSearchCities = vi.mocked(searchCities);

beforeEach(() => {
  vi.useFakeTimers();
  mockedSearchCities.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CityAutocomplete", () => {
  it("is disabled when no country is selected", () => {
    render(<CityAutocomplete countryCode={null} value={null} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: /city/i })).toBeDisabled();
  });

  it("waits 400ms after typing stops before calling searchCities", async () => {
    mockedSearchCities.mockResolvedValue(["Trencin"]);
    const user = userEvent.setup({ delay: null });
    render(<CityAutocomplete countryCode="SK" value={null} onChange={vi.fn()} />);

    await user.type(screen.getByRole("combobox", { name: /city/i }), "Tr");
    expect(mockedSearchCities).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(mockedSearchCities).toHaveBeenCalledWith("Tr", "SK");
  });

  it("only calls searchCities once after rapid typing", async () => {
    mockedSearchCities.mockResolvedValue(["Trencin"]);
    const user = userEvent.setup({ delay: null });
    render(<CityAutocomplete countryCode="SK" value={null} onChange={vi.fn()} />);

    const input = screen.getByRole("combobox", { name: /city/i });
    await user.type(input, "T");
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await user.type(input, "r");
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await user.type(input, "e");
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(mockedSearchCities).toHaveBeenCalledTimes(1);
    expect(mockedSearchCities).toHaveBeenCalledWith("Tre", "SK");
  });

  it("shows suggestions and calls onChange when one is selected", async () => {
    mockedSearchCities.mockResolvedValue(["Trencin", "Trencianske Teplice"]);
    const onChange = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<CityAutocomplete countryCode="SK" value={null} onChange={onChange} />);

    await user.type(screen.getByRole("combobox", { name: /city/i }), "Tr");
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    const option = await screen.findByRole("option", { name: "Trencin" });
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith("Trencin");
  });

  it("clears the selected city when the text is edited afterward", async () => {
    mockedSearchCities.mockResolvedValue([]);
    const onChange = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<CityAutocomplete countryCode="SK" value="Trencin" onChange={onChange} />);

    await user.type(screen.getByRole("combobox", { name: /city/i }), "x");

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/location/CityAutocomplete.test.tsx`
Expected: FAIL with "Cannot find module './CityAutocomplete'"

- [ ] **Step 3: Implement `CityAutocomplete`**

Create `components/location/CityAutocomplete.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { searchCities } from "@/lib/actions/searchCities";

interface CityAutocompleteProps {
  countryCode: string | null;
  value: string | null;
  onChange: (city: string | null) => void;
}

export function CityAutocomplete({ countryCode, value, onChange }: CityAutocompleteProps) {
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!countryCode || query.trim().length < 2 || query === value) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    debounceRef.current = setTimeout(() => {
      searchCities(query, countryCode).then((results) => {
        if (!cancelled) {
          setSuggestions(results);
          setOpen(true);
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, countryCode, value]);

  function selectCity(city: string) {
    onChange(city);
    setQuery(city);
    setSuggestions([]);
    setOpen(false);
  }

  function handleInputChange(next: string) {
    setQuery(next);
    setOpen(true);
    if (value !== null) {
      onChange(null);
    }
  }

  const showSuggestions = open && suggestions.length > 0;

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-label="City"
        aria-expanded={showSuggestions}
        aria-controls="city-suggestions"
        aria-autocomplete="list"
        autoComplete="off"
        disabled={!countryCode}
        placeholder="City"
        value={query}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {showSuggestions && (
        <ul
          id="city-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                role="option"
                aria-selected={city === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCity(city)}
                className="w-full px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/location/CityAutocomplete.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add components/location/CityAutocomplete.tsx components/location/CityAutocomplete.test.tsx
git commit -m "feat: add CityAutocomplete with 400ms debounced Geoapify search"
```

---

### Task 3: Wire `CityAutocomplete` into `LocationSelectCard`

**Files:**
- Modify: `components/location/LocationSelectCard.tsx`
- Modify: `components/location/LocationSelectCard.test.tsx`
- Modify: `app/page.test.tsx`

**Interfaces:**
- Consumes: `CityAutocomplete` from Task 2; `COUNTRIES` from `lib/locations.ts` (unchanged).
- Produces:
  ```ts
  interface LocationSelectCardProps {
    onSubmit: (country: string, city: string) => void;
    initialCountry?: string | null;
    initialCity?: string | null;
  }
  ```
  `onSubmit` contract is unchanged from before this task. `initialCountry`/`initialCity` default to `null`. Later tasks (`ChangeLocationDialog`, Task 4) pass these to prefill the card.

- [ ] **Step 1: Update `LocationSelectCard.tsx`**

Replace the full contents of `components/location/LocationSelectCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityAutocomplete } from "@/components/location/CityAutocomplete";
import { COUNTRIES } from "@/lib/locations";

interface LocationSelectCardProps {
  onSubmit: (country: string, city: string) => void;
  initialCountry?: string | null;
  initialCity?: string | null;
}

export function LocationSelectCard({
  onSubmit,
  initialCountry = null,
  initialCity = null,
}: LocationSelectCardProps) {
  const [country, setCountry] = useState<string | null>(initialCountry);
  const [city, setCity] = useState<string | null>(initialCity);

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

      <CityAutocomplete countryCode={country} value={city} onChange={setCity} />

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

- [ ] **Step 2: Update `LocationSelectCard.test.tsx`**

Replace the full contents of `components/location/LocationSelectCard.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationSelectCard } from "./LocationSelectCard";
import { searchCities } from "@/lib/actions/searchCities";

vi.mock("@/lib/actions/searchCities", () => ({
  searchCities: vi.fn(),
}));

const mockedSearchCities = vi.mocked(searchCities);

beforeEach(() => {
  vi.useFakeTimers();
  mockedSearchCities.mockReset();
  mockedSearchCities.mockResolvedValue(["Bratislava"]);
});

afterEach(() => {
  vi.useRealTimers();
});

async function pickCity(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByRole("combobox", { name: /city/i }), text);
  await act(async () => {
    vi.advanceTimersByTime(400);
  });
  await user.click(await screen.findByRole("option", { name: "Bratislava" }));
}

describe("LocationSelectCard", () => {
  it("disables Continue until both country and city are chosen", async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = vi.fn();
    render(<LocationSelectCard onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await pickCity(user, "Brat");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("calls onSubmit with the chosen country code and city on Continue", async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = vi.fn();
    render(<LocationSelectCard onSubmit={onSubmit} />);

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    await pickCity(user, "Brat");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith("SK", "Bratislava");
  });

  it("disables the City field until a country is chosen", () => {
    render(<LocationSelectCard onSubmit={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: /city/i })).toBeDisabled();
  });

  it("prefills country and city from initialCountry/initialCity", () => {
    render(
      <LocationSelectCard onSubmit={vi.fn()} initialCountry="SK" initialCity="Bratislava" />,
    );

    expect(screen.getByRole("combobox", { name: /country/i })).toHaveTextContent("Slovakia");
    expect(screen.getByRole("combobox", { name: /city/i })).toHaveValue("Bratislava");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });
});
```

- [ ] **Step 3: Update `app/page.test.tsx`**

Replace the full contents of `app/page.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/actions/searchCities", () => ({
  searchCities: vi.fn(),
}));

import { useLocationStore } from "@/lib/stores/location-store";
import { searchCities } from "@/lib/actions/searchCities";
import Page from "./page";

const mockedSearchCities = vi.mocked(searchCities);

beforeEach(() => {
  vi.useFakeTimers();
  replace.mockClear();
  localStorage.clear();
  useLocationStore.setState({ country: null, city: null });
  mockedSearchCities.mockReset();
  mockedSearchCities.mockResolvedValue(["Bratislava"]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Home page", () => {
  it("redirects to /dashboard when a location is already saved", () => {
    useLocationStore.setState({ country: "SK", city: "Bratislava" });
    render(<Page />);
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the location card and saves+navigates on submit", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Page />);
    expect(replace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    await user.type(screen.getByRole("combobox", { name: /city/i }), "Brat");
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    await user.click(await screen.findByRole("option", { name: "Bratislava" }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(useLocationStore.getState()).toMatchObject({ country: "SK", city: "Bratislava" });
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });
});
```

Note the added `afterEach` import: add `afterEach` to the `vitest` import list at the top (`import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/location/LocationSelectCard.test.tsx app/page.test.tsx`
Expected: PASS (4 tests in LocationSelectCard, 2 in page)

- [ ] **Step 5: Commit**

```bash
git add components/location/LocationSelectCard.tsx components/location/LocationSelectCard.test.tsx app/page.test.tsx
git commit -m "feat: replace static city Select with CityAutocomplete in LocationSelectCard"
```

---

### Task 4: `Dialog` UI primitive and `ChangeLocationDialog`

**Files:**
- Create: `components/ui/dialog.tsx`
- Create: `components/location/ChangeLocationDialog.tsx`
- Test: `components/location/ChangeLocationDialog.test.tsx`

**Interfaces:**
- Consumes: `LocationSelectCard` (with `initialCountry`/`initialCity` props from Task 3); `useLocationStore` from `lib/stores/location-store.ts` (`country`, `city`, `setLocation`).
- Produces:
  ```ts
  interface ChangeLocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
  function ChangeLocationDialog(props: ChangeLocationDialogProps): JSX.Element
  ```
  Later tasks (`AppHeader`, Task 5) own the `open` state and render this.

- [ ] **Step 1: Create the `Dialog` UI primitive**

Create `components/ui/dialog.tsx`:

```tsx
"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

function DialogPortal({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return (
    <DialogPrimitive.Portal {...props}>
      <DialogPrimitive.Backdrop
        data-slot="dialog-backdrop"
        className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      {children}
    </DialogPrimitive.Portal>
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <DialogPortal>
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-full max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#e4e4e7] bg-white shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

export { Dialog, DialogTrigger, DialogClose, DialogPortal, DialogContent }
```

Add `import * as React from "react"` at the top of the file (needed for `React.ComponentProps`):

```tsx
"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"
```

- [ ] **Step 2: Write the failing test for `ChangeLocationDialog`**

Create `components/location/ChangeLocationDialog.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/actions/searchCities", () => ({
  searchCities: vi.fn().mockResolvedValue([]),
}));

import { useLocationStore } from "@/lib/stores/location-store";
import { ChangeLocationDialog } from "./ChangeLocationDialog";

beforeEach(() => {
  replace.mockClear();
  localStorage.clear();
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
});

describe("ChangeLocationDialog", () => {
  it("does not render its contents when closed", () => {
    render(<ChangeLocationDialog open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /continue/i })).not.toBeInTheDocument();
  });

  it("prefills the current country and city when open", () => {
    render(<ChangeLocationDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("combobox", { name: /country/i })).toHaveTextContent("Slovakia");
    expect(screen.getByRole("combobox", { name: /city/i })).toHaveValue("Bratislava");
  });

  it("saves the new location, closes, and redirects to /dashboard on submit", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ChangeLocationDialog open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(useLocationStore.getState()).toMatchObject({ country: "SK", city: "Bratislava" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run components/location/ChangeLocationDialog.test.tsx`
Expected: FAIL with "Cannot find module './ChangeLocationDialog'"

- [ ] **Step 4: Implement `ChangeLocationDialog`**

Create `components/location/ChangeLocationDialog.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LocationSelectCard } from "@/components/location/LocationSelectCard";
import { useLocationStore } from "@/lib/stores/location-store";

interface ChangeLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeLocationDialog({ open, onOpenChange }: ChangeLocationDialogProps) {
  const router = useRouter();
  const country = useLocationStore((s) => s.country);
  const city = useLocationStore((s) => s.city);
  const setLocation = useLocationStore((s) => s.setLocation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LocationSelectCard
          initialCountry={country}
          initialCity={city}
          onSubmit={(selectedCountry, selectedCity) => {
            setLocation(selectedCountry, selectedCity);
            onOpenChange(false);
            router.replace("/dashboard");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run components/location/ChangeLocationDialog.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add components/ui/dialog.tsx components/location/ChangeLocationDialog.tsx components/location/ChangeLocationDialog.test.tsx
git commit -m "feat: add Dialog primitive and ChangeLocationDialog for editing saved location"
```

---

### Task 5: "Change location" trigger in `AppHeader`

**Files:**
- Modify: `components/layout/AppHeader.tsx`
- Modify: `components/layout/AppHeader.test.tsx`

**Interfaces:**
- Consumes: `ChangeLocationDialog` from Task 4; `useLocationStore` (`city`) from `lib/stores/location-store.ts`.

- [ ] **Step 1: Update `AppHeader.tsx`**

Replace the full contents of `components/layout/AppHeader.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { useLocationStore } from "@/lib/stores/location-store";
import { ChangeLocationDialog } from "@/components/location/ChangeLocationDialog";

export function AppHeader() {
  const itemCount = useCartStore((s) => s.items.length);
  const toggleCartOpen = useDashboardUiStore((s) => s.toggleCartOpen);
  const city = useLocationStore((s) => s.city);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
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

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setLocationDialogOpen(true)}
          aria-label="Change location"
        >
          {city ?? "Set location"}
        </Button>
        <Button variant="outline" onClick={toggleCartOpen} aria-label="Cart">
          Cart
          {itemCount > 0 && (
            <Badge data-testid="cart-count-badge" className="ml-2">
              {itemCount}
            </Badge>
          )}
        </Button>
      </div>

      <ChangeLocationDialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen} />
    </header>
  );
}
```

- [ ] **Step 2: Update `AppHeader.test.tsx`**

Replace the full contents of `components/layout/AppHeader.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/actions/searchCities", () => ({
  searchCities: vi.fn().mockResolvedValue([]),
}));

import { AppHeader } from "./AppHeader";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { useLocationStore } from "@/lib/stores/location-store";
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
  replace.mockClear();
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({
    selectedStore: StoreName.Lidl,
    activeCategory: "All",
    cartOpen: true,
  });
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
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

  it("shows the current city on the location trigger button", () => {
    render(<AppHeader />);
    expect(screen.getByRole("button", { name: /change location/i })).toHaveTextContent(
      "Bratislava",
    );
  });

  it("opens the change-location dialog when the location button is clicked", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: /change location/i }));

    expect(screen.getByRole("combobox", { name: /country/i })).toHaveTextContent("Slovakia");
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run components/layout/AppHeader.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 4: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: All test files pass.

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add components/layout/AppHeader.tsx components/layout/AppHeader.test.tsx
git commit -m "feat: add change-location trigger to AppHeader"
```

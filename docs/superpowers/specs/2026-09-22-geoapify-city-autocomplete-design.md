# Geoapify City Autocomplete Design

## Goal

Replace the static, Slovakia-only city list with a live Geoapify-backed
autocomplete textfield, and let users change their saved Country/City from
the dashboard by reusing the same location-selection UI in a modal.

## Background

`lib/locations.ts` currently hardcodes a `COUNTRIES` array with one country
(Slovakia) and a fixed list of cities. `LocationSelectCard` renders both
Country and City as shadcn `Select` dropdowns sourced from that list. There
is currently no way to change location once it's set on `/` — the dashboard
redirects back to `/` only when country/city are missing.

## Architecture

- **Country** stays a fixed `Select` dropdown, sourced from the existing
  `COUNTRIES` list in `lib/locations.ts` (no change to that list or its
  shape).
- **City** becomes a free-text autocomplete: keystrokes are debounced
  400ms, then sent through a Next.js Server Action that calls the Geoapify
  Autocomplete API server-side (so `GEOAPIFY_API_KEY` never reaches the
  browser, matching how the Lidl/Kaufland vendor calls are kept server-side
  in `lib/fetchDashboardData.ts`). The action returns a plain
  `string[]` of city names; the component renders them as a suggestion
  list under the input.
- Selecting a suggestion sets the saved city (a plain string). Typing
  again after a selection clears the saved city, so "Continue" still
  requires an explicit pick rather than free-typed text.
- A new **"Change location" control** in `AppHeader`, next to the `Cart`
  button, opens a `Dialog` containing the same `LocationSelectCard`,
  prefilled with the current country/city from `useLocationStore`. On
  submit it saves the new location and redirects to `/dashboard` (a full
  navigation/remount, not an in-place refetch), matching how `/`'s own
  submit flow works today.

## Components

### `lib/actions/searchCities.ts` (new, `'use server'`)

```ts
export async function searchCities(query: string, countryCode: string): Promise<string[]>
```

- Returns `[]` immediately if `query.trim().length < 2` (no network call
  for empty/near-empty input).
- Calls:
  `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&type=city&filter=countrycode:${countryCode}&apiKey=${process.env.GEOAPIFY_API_KEY}`
- Maps `features[].properties.city`, filters out empty/undefined values,
  dedupes (preserving API order), returns the resulting `string[]`.
- On a non-OK response or fetch failure, returns `[]` (autocomplete
  degrades to "no suggestions" rather than throwing into the input
  component).

### `components/location/CityAutocomplete.tsx` (new)

```ts
interface CityAutocompleteProps {
  countryCode: string | null;
  value: string | null;
  onChange: (city: string | null) => void;
}
```

- Renders a shadcn `Input` plus a suggestion list (shown when there are
  results and the input is focused).
- Disabled when `countryCode` is `null` (same as today's city `Select`
  disabled-until-country-chosen behavior).
- Debounces the input value 400ms before calling `searchCities`; a change
  to `countryCode` clears any pending debounce and current suggestions.
- Selecting a suggestion calls `onChange(city)` and closes the list.
  Editing the text after a selection calls `onChange(null)` immediately
  (so the parent's "can continue" check still requires a real pick) and
  restarts the debounce cycle for the new text.
- Cleans up its debounce timer on unmount.

### `components/location/LocationSelectCard.tsx` (modified)

- Country `Select` unchanged.
- City `Select` replaced with `CityAutocomplete`, wired to the same local
  `city` state. `countryCode` prop is the selected country's `code`.
- Add optional `initialCountry` / `initialCity` props (both default
  `null`) so the same card can be reused prefilled inside the dashboard's
  change-location dialog. `onSubmit(country, city)` contract is unchanged,
  so `app/page.tsx` requires no changes.

### `components/location/ChangeLocationDialog.tsx` (new)

```ts
interface ChangeLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

- Wraps `LocationSelectCard` in a shadcn `Dialog`, passing
  `initialCountry`/`initialCity` from `useLocationStore`.
- On submit: calls `setLocation(country, city)`, then `onOpenChange(false)`,
  then `router.replace("/dashboard")`.

### `components/layout/AppHeader.tsx` (modified)

- Adds a location trigger button ("Change location", showing the current
  city name) to the left of the `Cart` button, which opens
  `ChangeLocationDialog` (local `open` state owned by `AppHeader`).

## Data Flow

1. User types in the City field on `/` (or inside the dashboard's change
   dialog) → debounced 400ms → `searchCities(query, countryCode)` server
   action → Geoapify API → city name strings → rendered as suggestions.
2. User picks a suggestion → city string stored in local component state
   → `LocationSelectCard`'s `onSubmit` fires on "Continue" → caller
   persists it via `useLocationStore.setLocation`.
3. Dashboard's "Change location" button → dialog prefilled from the store
   → same submit path → store updated → `router.replace("/dashboard")`.

## Error Handling

- Geoapify request failure/non-OK response: `searchCities` returns `[]`;
  the UI simply shows no suggestions (no error banner — matches the
  low-stakes nature of a search-as-you-type field).
- Missing `GEOAPIFY_API_KEY` env var at request time: `searchCities`
  returns `[]` immediately without calling Geoapify (avoids sending a
  request with an empty `apiKey` param).

## Environment

- Add `GEOAPIFY_API_KEY` (server-only) to `.env.local`.
- Add a `.env.example` file (explicitly un-ignored, since `.env*` is
  gitignored) documenting `GEOAPIFY_API_KEY=` with no value, so the
  requirement is discoverable without committing a real key.

## Testing

- `searchCities`: unit tests with mocked global `fetch` — short query
  short-circuits, successful response maps/dedupes city names, non-OK
  response and thrown fetch both resolve to `[]`, missing API key
  short-circuits.
- `CityAutocomplete`: RTL tests with fake timers — debounce delays the
  call by 400ms, rapid typing only triggers one call after typing stops,
  selecting a suggestion calls `onChange` with that city and clears the
  list, editing after selection calls `onChange(null)`, disabled when no
  country is set.
- `LocationSelectCard`: existing tests updated for the new City field;
  add a case for `initialCountry`/`initialCity` prefill.
- `ChangeLocationDialog`: prefill from the store, submit updates the
  store and navigates to `/dashboard`.
- `AppHeader`: opening the dialog via the new trigger button.

## Out of Scope

- Expanding `COUNTRIES` beyond Slovakia (Country stays a fixed dropdown).
- In-place refetch of dashboard data after a location change (a full
  redirect/remount to `/dashboard` is used instead, per explicit
  decision).
- Geolocation/"use my current location" affordances.

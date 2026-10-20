# Backend integration — design decisions

Source spec: `../../BACKEND_INTEGRATION.md` (branch `backend-integration`). This note records decisions made after brainstorming; it does not repeat the spec.

## Decisions

- The backend API is the only offers source. `providers/`, `libs/kaufland-discounts`, `libs/lidl-discounts`, location selection, and the Geoapify city search are removed.
- `/` redirects to `/dashboard`. There is no location step.
- Data flow: `GET /shops` → `getShopStatus` per frontend `ShopKey` → `GET /shops/{shop}/offers` only for `available` shops → `normalizeOffer` → sort by `position` → `toDisplayOffer` at render time.
- A failed `/shops` request shows a generic error with retry. A failed offers request affects only that shop's area.
- Image toggle in the header hides images on cards. When it is on: `isCropped: false` shows the full page image; `isCropped: true` shows only the `boundaryBox` region (CSS background-size/position).
- The cart and UI stores are persisted with a version bump. Old cart items (old `Offer` shape) are dropped on load.
- `NEXT_PUBLIC_API_URL` is read from the environment and listed in `.env.example`. Tests mock `fetch`.
- The `libs/` folder is deleted; git keeps its history.

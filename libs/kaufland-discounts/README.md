# kaufland-discounts (TypeScript)

Server-side TypeScript port of the Python CLI in the parent directory — look up current Kaufland
discounts for a city and get back plain JSON or a thrown error.

```ts
import { lookupDiscounts } from "kaufland-discounts";

const result = await lookupDiscounts("Dubnica", { country: "SK" });
```

Full API reference, error-to-HTTP-status mapping, and the JSON Schemas this library's types
implement: [`../docs/typescript-api.md`](../docs/typescript-api.md).

```
npm install
npm run build
npm test
```

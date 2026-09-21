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

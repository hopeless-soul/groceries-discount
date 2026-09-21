import { BillaProvider } from "./billa";
import { KauflandProvider } from "./kaufland";
import { TescoProvider } from "./tesco";
import type { DashboardData } from "@/lib/types";
import { type GroceryProvider, StoreName } from "./types";

const emptyData = (name: StoreName, label: string, dotColor: string): DashboardData => ({
  store: { id: name, label, dotColor },
  categories: [],
  offers: [],
});

// TODO(Task 7): replace with LidlProvider
const lidlPlaceholder: GroceryProvider = {
  name: StoreName.Lidl,
  label: "Lidl",
  dotColor: "#2563eb",
  fetch: async () => emptyData(StoreName.Lidl, "Lidl", "#2563eb"),
};

export const groceryProviders: Record<StoreName, GroceryProvider> = {
  [StoreName.Lidl]: lidlPlaceholder, // TODO(Task 7): replace with LidlProvider
  [StoreName.Kaufland]: new KauflandProvider(),
  [StoreName.Billa]: new BillaProvider(),
  [StoreName.Tesco]: new TescoProvider(),
};

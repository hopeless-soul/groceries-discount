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

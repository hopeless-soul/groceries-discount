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

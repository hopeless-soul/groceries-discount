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

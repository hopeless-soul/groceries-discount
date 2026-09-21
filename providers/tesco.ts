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

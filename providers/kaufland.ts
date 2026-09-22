import {
  AmbiguousStoreError,
  fetchDiscounts,
  lookupDiscounts,
  NoStoreFoundError,
  type DiscountsResponse,
} from "kaufland-discounts";
import type { DashboardData, Offer, Category } from "@/lib/types";
import { computeDaysLeft, computeRingPercent } from "@/lib/validity";
import { type GroceryProvider, StoreName } from "./types";

export class KauflandProvider implements GroceryProvider {
  name = StoreName.Kaufland;
  label = "Kaufland";
  dotColor = "#dc2626";

  async fetch(country: string, city: string): Promise<DashboardData> {
    try {
      const response = await lookupDiscounts(city, { country });
      return this.normalize(response);
    } catch (err) {
      if (err instanceof AmbiguousStoreError) {
        // findStores/fetchStoreList has no caching, so re-calling lookupDiscounts
        // with storeIndex would re-fetch the store list. Use the stores the error
        // already carries and go straight to fetchDiscounts for the picked one.
        const response = await fetchDiscounts(err.stores[0].store_code);
        return this.normalize(response);
      }
      if (err instanceof NoStoreFoundError) {
        return this.emptyData();
      }
      throw err;
    }
  }

  private normalize(response: DiscountsResponse): DashboardData {
    const categories: Category[] = response.categories.map((c) => ({
      id: c.category_id,
      name: c.category_name,
      count: c.offer_count,
    }));

    const offers: Offer[] = response.offers.map((o) => {
      const regularPrice = o.old_price ?? o.price;
      const discountPercent =
        o.discount_percent ??
        (regularPrice > 0 ? Math.round((1 - o.price / regularPrice) * 100) : 0);
      return {
        id: o.offer_id,
        title: o.title,
        subtitle: o.subtitle ?? "",
        categoryId: o.category_id,
        regularPrice,
        discountedPrice: o.price,
        discountPercent,
        validUntil: o.valid_to,
        daysLeft: computeDaysLeft(o.valid_to),
        ringPercent: computeRingPercent(o.valid_from, o.valid_to),
        imageUrl: o.image_url ?? null,
      };
    });

    return {
      store: { id: this.name, label: this.label, dotColor: this.dotColor },
      categories,
      offers,
    };
  }

  private emptyData(): DashboardData {
    return { store: { id: this.name, label: this.label, dotColor: this.dotColor }, categories: [], offers: [] };
  }
}

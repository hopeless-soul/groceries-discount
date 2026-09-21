import { LidlPlus, LidlStoreNotFoundError, type OfferData } from "lidl-discounts";
import { slugify } from "kaufland-discounts";
import type { Category, DashboardData, Offer } from "@/lib/types";
import { computeDaysLeft, computeRingPercent } from "@/lib/validity";
import { type GroceryProvider, StoreName } from "./types";

export class LidlProvider implements GroceryProvider {
  name = StoreName.Lidl;
  label = "Lidl";
  dotColor = "#2563eb";

  async fetch(country: string, city: string): Promise<DashboardData> {
    const client = new LidlPlus({ country });
    try {
      const { offers } = await client.offersForStoreSearch(city);
      return this.normalize(offers.offers);
    } catch (err) {
      if (err instanceof LidlStoreNotFoundError) {
        return this.emptyData();
      }
      throw err;
    }
  }

  private normalize(offers: OfferData[]): DashboardData {
    const categoryCounts = new Map<string, { name: string; count: number }>();
    const normalizedOffers: Offer[] = [];

    for (const offer of offers) {
      const categoryName = offer.category ?? "Other";
      const categoryId = slugify(categoryName);
      const existing = categoryCounts.get(categoryId);
      categoryCounts.set(categoryId, {
        name: categoryName,
        count: (existing?.count ?? 0) + 1,
      });

      const regularPrice = offer.priceBox?.smallPartNumeric ?? offer.priceBox?.largePartNumeric ?? 0;
      const discountedPrice = offer.priceBox?.largePartNumeric ?? 0;
      const discountPercent =
        regularPrice > 0 ? Math.round((1 - discountedPrice / regularPrice) * 100) : 0;
      const validUntil = offer.endValidityDate ?? new Date().toISOString();
      const validFrom = offer.startValidityDate ?? validUntil;

      normalizedOffers.push({
        id: offer.id ?? crypto.randomUUID(),
        title: offer.title ?? "",
        subtitle: offer.packaging ?? offer.pricePerUnit ?? "",
        categoryId,
        regularPrice,
        discountedPrice,
        discountPercent,
        validUntil,
        daysLeft: computeDaysLeft(validUntil),
        ringPercent: computeRingPercent(validFrom, validUntil),
      });
    }

    const categories: Category[] = Array.from(categoryCounts.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      count: v.count,
    }));

    return {
      store: { id: this.name, label: this.label, dotColor: this.dotColor },
      categories,
      offers: normalizedOffers,
    };
  }

  private emptyData(): DashboardData {
    return { store: { id: this.name, label: this.label, dotColor: this.dotColor }, categories: [], offers: [] };
  }
}

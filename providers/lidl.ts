import { LidlPlus, LidlStoreNotFoundError, type OfferData } from "lidl-discounts";
import { slugify } from "kaufland-discounts";
import type { Category, DashboardData, Offer } from "@/lib/types";
import { computeDaysLeft, computeRingPercent } from "@/lib/validity";
import { type GroceryProvider, StoreName } from "./types";

/**
 * Deterministic djb2-based string hash. Used to derive a stable synthetic id
 * for offers that don't already carry one from the API — the same raw offer
 * fields must always hash to the same id across separate fetches, or a cart
 * entry keyed on that id becomes unreachable after a refetch.
 */
function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

/**
 * Builds a synthetic offer id from fields that are stable across refetches
 * of the same real-world offer (title, packaging/unit price, category, and
 * the raw validity window as reported by the API — not the defaulted
 * `validUntil`, which falls back to `new Date()` and would change on every
 * fetch). Deliberately avoids `crypto.randomUUID()`, which regenerates on
 * every normalize() call and breaks cart identity for offers without an id.
 */
function syntheticOfferId(offer: OfferData): string {
  const parts = [
    offer.title ?? "",
    offer.category ?? "",
    offer.packaging ?? "",
    offer.pricePerUnit ?? "",
    String(offer.priceBox?.smallPartNumeric ?? ""),
    String(offer.priceBox?.largePartNumeric ?? ""),
    offer.startValidityDate ?? "",
    offer.endValidityDate ?? "",
  ].join("|");
  return `lidl-synthetic-${hashString(parts)}`;
}

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
        id: offer.id ?? syntheticOfferId(offer),
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

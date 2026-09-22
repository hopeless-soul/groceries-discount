import type { Category, Offer } from "@/lib/types";

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Drops offers that are the same product fetched twice: same normalized
 * title and the same regular price. First occurrence wins.
 */
export function dedupeOffers(offers: Offer[]): Offer[] {
  const seen = new Set<string>();
  const result: Offer[] = [];

  for (const offer of offers) {
    const key = `${normalize(offer.title)}|${offer.regularPrice}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(offer);
  }

  return result;
}

/**
 * Drops categories that are the same category fetched twice: same
 * normalized name and same normalized id. First occurrence wins. Counts are
 * not touched here — recomputeCategoryCounts derives them from the deduped
 * offer list afterwards.
 */
export function dedupeCategories(categories: Category[]): Category[] {
  const seen = new Set<string>();
  const result: Category[] = [];

  for (const category of categories) {
    const key = `${normalize(category.name)}|${normalize(category.id)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(category);
  }

  return result;
}

/** Recomputes each category's count from how many offers actually reference it. */
export function recomputeCategoryCounts(categories: Category[], offers: Offer[]): Category[] {
  const counts = new Map<string, number>();
  for (const offer of offers) {
    counts.set(offer.categoryId, (counts.get(offer.categoryId) ?? 0) + 1);
  }

  return categories.map((category) => ({
    ...category,
    count: counts.get(category.id) ?? 0,
  }));
}

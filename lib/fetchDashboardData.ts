"use server";

import type { DashboardData } from "@/lib/types";
import { dedupeCategories, dedupeOffers, recomputeCategoryCounts } from "@/lib/dedupe";
import { groceryProviders } from "@/providers/registry";
import type { StoreName } from "@/providers/types";

export async function fetchDashboardData(
  name: StoreName,
  country: string,
  city: string,
): Promise<DashboardData> {
  const data = await groceryProviders[name].fetch(country, city);

  const offers = dedupeOffers(data.offers);
  const categories = recomputeCategoryCounts(dedupeCategories(data.categories), offers);

  return { ...data, categories, offers };
}

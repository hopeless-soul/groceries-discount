"use server";

import type { DashboardData } from "@/lib/types";
import { groceryProviders } from "@/providers/registry";
import type { StoreName } from "@/providers/types";

export async function fetchDashboardData(
  name: StoreName,
  country: string,
  city: string,
): Promise<DashboardData> {
  return groceryProviders[name].fetch(country, city);
}

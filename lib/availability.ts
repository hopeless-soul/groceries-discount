import type { DashboardData, Offer } from "@/lib/types";
import { recomputeCategoryCounts } from "@/lib/dedupe";

/** An offer is available once its discount has started; no start date means it already has. */
export function isOfferAvailable(offer: Offer, now: Date = new Date()): boolean {
  if (!offer.validFrom) return true;
  return new Date(offer.validFrom).getTime() <= now.getTime();
}

export interface SplitDashboardData {
  available: DashboardData;
  upcoming: Offer[];
}

/**
 * Splits fetched data into offers that have started and those that haven't.
 * Runs at render time rather than at fetch time because dashboard data is
 * cached client-side for hours — an offer starting tomorrow must appear once
 * it starts, not once the cache expires. Category counts are recomputed so
 * they only count the available offers.
 */
export function splitByAvailability(data: DashboardData, now: Date = new Date()): SplitDashboardData {
  const available: Offer[] = [];
  const upcoming: Offer[] = [];
  for (const offer of data.offers) {
    (isOfferAvailable(offer, now) ? available : upcoming).push(offer);
  }

  return {
    available: {
      ...data,
      offers: available,
      categories: recomputeCategoryCounts(data.categories, available),
    },
    upcoming,
  };
}

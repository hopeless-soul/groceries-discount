import { toLocalDateString } from "@/lib/validity";

/** An offer is available once its discount has started (local-date comparison). */
export function isOfferAvailable(offer: { validFrom: string }, now: Date = new Date()): boolean {
  return offer.validFrom <= toLocalDateString(now);
}

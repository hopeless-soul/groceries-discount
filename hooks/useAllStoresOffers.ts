"use client";

import { useEffect, useState } from "react";
import { buildCacheKey, cachedFetch } from "@/lib/cache/fetchCache";
import { fetchDashboardData } from "@/lib/fetchDashboardData";
import type { Offer } from "@/lib/types";
import { StoreName } from "@/providers/types";

export interface OfferWithStore extends Offer {
  storeId: string;
  storeLabel: string;
  storeDotColor: string;
}

export interface UseAllStoresOffersResult {
  offers: OfferWithStore[];
  loading: boolean;
  error: Error | null;
}

export function useAllStoresOffers(
  country: string | null,
  city: string | null,
  enabled: boolean,
): UseAllStoresOffersResult {
  const [offers, setOffers] = useState<OfferWithStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !country || !city) return;
    let cancelled = false;

    (async () => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
      try {
        const results = await Promise.all(
          Object.values(StoreName).map((store) =>
            cachedFetch(buildCacheKey("dashboard", store, country, city), () =>
              fetchDashboardData(store, country, city),
            ),
          ),
        );
        if (!cancelled) {
          setOffers(
            results.flatMap((data) =>
              data.offers.map((offer) => ({
                ...offer,
                storeId: data.store.id,
                storeLabel: data.store.label,
                storeDotColor: data.store.dotColor,
              })),
            ),
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setOffers([]);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, country, city]);

  return { offers, loading, error };
}

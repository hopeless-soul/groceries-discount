"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { splitByAvailability } from "@/lib/availability";
import { buildCacheKey, cachedFetch, invalidateFetchCache } from "@/lib/cache/fetchCache";
import { fetchDashboardData } from "@/lib/fetchDashboardData";
import { useLocationStore } from "@/lib/stores/location-store";
import type { DashboardData, Offer } from "@/lib/types";
import type { StoreName } from "@/providers/types";

export interface UseDashboardDataResult {
  /** Only offers whose discount has already started. */
  data: DashboardData | null;
  /** Offers whose discount hasn't started yet. */
  upcoming: Offer[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDashboardData(storeName: StoreName): UseDashboardDataResult {
  const country = useLocationStore((s) => s.country);
  const city = useLocationStore((s) => s.city);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!country || !city) return;
    let cancelled = false;

    (async () => {
      if (!cancelled) {
        setData(null);
        setLoading(true);
        setError(null);
      }
      try {
        const key = buildCacheKey("dashboard", storeName, country, city);
        const result = await cachedFetch(key, () => fetchDashboardData(storeName, country, city));
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeName, country, city, version]);

  const refetch = useCallback(() => {
    if (country && city) {
      invalidateFetchCache(buildCacheKey("dashboard", storeName, country, city));
    }
    setVersion((v) => v + 1);
  }, [storeName, country, city]);

  const { available, upcoming } = useMemo(
    () => (data ? splitByAvailability(data) : { available: null, upcoming: [] }),
    [data],
  );

  return { data: available, upcoming, loading, error, refetch };
}

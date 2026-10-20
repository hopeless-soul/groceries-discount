"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchShopOffers } from "@/lib/api/client";
import { buildCacheKey, cachedFetch, invalidateFetchCache } from "@/lib/cache/fetchCache";
import type { ShopKey } from "@/lib/config/shops";
import type { ApiOffer } from "@/lib/types";

interface OffersState {
  id: string;
  offers: ApiOffer[] | null;
  error: Error | null;
}

export interface UseShopOffersResult {
  offers: ApiOffer[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Fetches one shop's offers. Pass `enabled: false` for shops that are not available. */
export function useShopOffers(shop: ShopKey, enabled: boolean): UseShopOffersResult {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<OffersState | null>(null);
  const id = `${shop}:${version}`;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    cachedFetch(buildCacheKey("offers", shop), () => fetchShopOffers(shop))
      .then((offers) => {
        if (!cancelled) setState({ id, offers, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ id, offers: null, error: err instanceof Error ? err : new Error(String(err)) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shop, enabled, id]);

  const refetch = useCallback(() => {
    invalidateFetchCache(buildCacheKey("offers", shop));
    setVersion((v) => v + 1);
  }, [shop]);

  const current = state?.id === id ? state : null;
  return {
    offers: enabled ? current?.offers ?? null : null,
    loading: enabled && !current,
    error: current?.error ?? null,
    refetch,
  };
}

/** Fetches offers for several shops at once (the all-stores search). */
export function useAllShopOffers(
  shops: ShopKey[],
  enabled: boolean,
): { offers: ApiOffer[]; loading: boolean; error: Error | null } {
  const id = shops.join(",");
  const [state, setState] = useState<OffersState | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const keys = id ? (id.split(",") as ShopKey[]) : [];
    Promise.all(keys.map((key) => cachedFetch(buildCacheKey("offers", key), () => fetchShopOffers(key))))
      .then((results) => {
        if (!cancelled) setState({ id, offers: results.flat(), error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ id, offers: null, error: err instanceof Error ? err : new Error(String(err)) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, enabled]);

  const current = state?.id === id ? state : null;
  return {
    offers: (enabled && current?.offers) || [],
    loading: enabled && !current,
    error: current?.error ?? null,
  };
}

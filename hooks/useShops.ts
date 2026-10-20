"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchShops } from "@/lib/api/client";
import { invalidateFetchCache, cachedFetch } from "@/lib/cache/fetchCache";
import { shopKeys, type ShopKey } from "@/lib/config/shops";
import { getShopStatus, type ShopStatus } from "@/lib/shops";
import type { ApiShop } from "@/lib/types";
import { toLocalDateString } from "@/lib/validity";

const SHOPS_KEY = "shops";

export interface UseShopsResult {
  shops: ApiShop[] | null;
  /** Status per frontend shop key, derived from `shops` for today's date. */
  statuses: Record<ShopKey, ShopStatus> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useShops(): UseShopsResult {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    version: number;
    shops: ApiShop[] | null;
    error: Error | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    cachedFetch(SHOPS_KEY, fetchShops)
      .then((shops) => {
        if (!cancelled) setState({ version, shops, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ version, shops: null, error: err instanceof Error ? err : new Error(String(err)) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const current = state?.version === version ? state : null;
  const today = toLocalDateString();
  const statuses = current?.shops
    ? Object.fromEntries(shopKeys.map((key) => [key, getShopStatus(key, current.shops!, today)])) as Record<ShopKey, ShopStatus>
    : null;

  const refetch = useCallback(() => {
    invalidateFetchCache(SHOPS_KEY);
    setVersion((v) => v + 1);
  }, []);

  return {
    shops: current?.shops ?? null,
    statuses,
    loading: !current,
    error: current?.error ?? null,
    refetch,
  };
}

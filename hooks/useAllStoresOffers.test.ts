import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAllStoresOffers } from "./useAllStoresOffers";
import { clearFetchCache } from "@/lib/cache/fetchCache";
import { StoreName } from "@/providers/types";

const fetchDashboardData = vi.fn();
vi.mock("@/lib/fetchDashboardData", () => ({
  fetchDashboardData: (...args: unknown[]) => fetchDashboardData(...args),
}));

const dataFor = (store: StoreName) => ({
  store: { id: store, label: store, dotColor: "#000" },
  categories: [],
  offers: [
    {
      id: `${store}-o1`,
      title: `${store} bread`,
      subtitle: "",
      categoryId: "bakery",
      regularPrice: 2,
      discountedPrice: 1,
      discountPercent: 50,
      validUntil: "2026-09-22T00:00:00.000Z",
      daysLeft: 4,
      ringPercent: 50,
    },
  ],
});

beforeEach(() => {
  fetchDashboardData.mockReset();
  clearFetchCache();
  fetchDashboardData.mockImplementation((store: StoreName) => Promise.resolve(dataFor(store)));
});

describe("useAllStoresOffers", () => {
  it("does nothing when disabled", () => {
    const { result } = renderHook(() => useAllStoresOffers("SK", "Bratislava", false));
    expect(result.current.offers).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(fetchDashboardData).not.toHaveBeenCalled();
  });

  it("fetches every store once and flattens the offers with store info", async () => {
    const { result } = renderHook(() => useAllStoresOffers("SK", "Bratislava", true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchDashboardData).toHaveBeenCalledTimes(Object.values(StoreName).length);
    expect(result.current.offers).toHaveLength(Object.values(StoreName).length);
    expect(result.current.offers).toContainEqual(
      expect.objectContaining({ storeId: StoreName.Kaufland, storeLabel: StoreName.Kaufland, title: "kaufland bread" }),
    );
  });

  it("sets an error when a store's fetch rejects", async () => {
    fetchDashboardData.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useAllStoresOffers("SK", "Bratislava", true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.offers).toEqual([]);
  });

  it("serves from the fetch cache on a second mount instead of re-fetching", async () => {
    const first = renderHook(() => useAllStoresOffers("SK", "Bratislava", true));
    await waitFor(() => expect(first.result.current.loading).toBe(false));

    fetchDashboardData.mockClear();
    const second = renderHook(() => useAllStoresOffers("SK", "Bratislava", true));
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(fetchDashboardData).not.toHaveBeenCalled();
    expect(second.result.current.offers).toHaveLength(Object.values(StoreName).length);
  });
});

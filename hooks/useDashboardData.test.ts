import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDashboardData } from "./useDashboardData";
import { clearFetchCache } from "@/lib/cache/fetchCache";
import { useLocationStore } from "@/lib/stores/location-store";
import { StoreName } from "@/providers/types";

const fetchDashboardData = vi.fn();
vi.mock("@/lib/fetchDashboardData", () => ({
  fetchDashboardData: (...args: unknown[]) => fetchDashboardData(...args),
}));

const sampleData = {
  store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" },
  categories: [],
  offers: [],
};

beforeEach(() => {
  fetchDashboardData.mockReset();
  clearFetchCache();
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
});

describe("useDashboardData", () => {
  it("starts loading, then resolves with data", async () => {
    fetchDashboardData.mockResolvedValueOnce(sampleData);
    const { result } = renderHook(() => useDashboardData(StoreName.Lidl));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(sampleData);
    expect(result.current.error).toBeNull();
    expect(fetchDashboardData).toHaveBeenCalledWith(StoreName.Lidl, "SK", "Bratislava");
  });

  it("sets error when the fetch rejects", async () => {
    fetchDashboardData.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useDashboardData(StoreName.Lidl));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeNull();
  });

  it("refetches when storeName changes", async () => {
    fetchDashboardData.mockResolvedValue(sampleData);
    const { result, rerender } = renderHook(
      ({ store }) => useDashboardData(store),
      { initialProps: { store: StoreName.Lidl } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ store: StoreName.Kaufland });
    await waitFor(() => expect(fetchDashboardData).toHaveBeenCalledWith(StoreName.Kaufland, "SK", "Bratislava"));
  });

  it("refetch() re-runs the fetch", async () => {
    fetchDashboardData.mockResolvedValue(sampleData);
    const { result } = renderHook(() => useDashboardData(StoreName.Lidl));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.refetch());
    await waitFor(() => expect(fetchDashboardData).toHaveBeenCalledTimes(2));
  });

  it("flips loading back to true synchronously (before any await) when refetch() is called", async () => {
    fetchDashboardData.mockResolvedValue(sampleData);
    const { result } = renderHook(() => useDashboardData(StoreName.Lidl));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.refetch());
    // No await/waitFor before this assertion: the effect's setLoading(true) must run
    // synchronously within the same act() flush, not after a microtask/.then() tick.
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("flips loading back to true synchronously (before any await) when storeName changes", async () => {
    fetchDashboardData.mockResolvedValue(sampleData);
    const { result, rerender } = renderHook(
      ({ store }) => useDashboardData(store),
      { initialProps: { store: StoreName.Lidl } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ store: StoreName.Kaufland });
    // Same guarantee as above, exercised via the storeName-change path instead of refetch().
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("clears the previous store's data synchronously when storeName changes", async () => {
    const lidlData = { ...sampleData, store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" } };
    fetchDashboardData.mockResolvedValue(lidlData);
    const { result, rerender } = renderHook(
      ({ store }) => useDashboardData(store),
      { initialProps: { store: StoreName.Lidl } },
    );
    await waitFor(() => expect(result.current.data).toEqual(lidlData));

    rerender({ store: StoreName.Kaufland });
    // Must not still show Lidl's data while Kaufland's fetch is in flight.
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("hides offers whose discount hasn't started yet and exposes them as upcoming", async () => {
    const base = {
      subtitle: "",
      categoryId: "bakery",
      regularPrice: 2,
      discountedPrice: 1,
      discountPercent: 50,
      validUntil: "2999-01-10T00:00:00.000Z",
      daysLeft: 5,
      ringPercent: 0,
      imageUrl: null,
    };
    fetchDashboardData.mockResolvedValueOnce({
      ...sampleData,
      categories: [{ id: "bakery", name: "Bakery", count: 2 }],
      offers: [
        { ...base, id: "now", title: "Bread", validFrom: "2000-01-01T00:00:00.000Z" },
        { ...base, id: "later", title: "Rolls", validFrom: "2999-01-01T00:00:00.000Z" },
      ],
    });
    const { result } = renderHook(() => useDashboardData(StoreName.Lidl));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.offers.map((o) => o.id)).toEqual(["now"]);
    expect(result.current.data?.categories).toEqual([{ id: "bakery", name: "Bakery", count: 1 }]);
    expect(result.current.upcoming.map((o) => o.id)).toEqual(["later"]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDashboardData } from "./useDashboardData";
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
});

import { describe, expect, it, vi } from "vitest";
import { fetchDashboardData } from "./fetchDashboardData";
import { StoreName } from "@/providers/types";
import { groceryProviders } from "@/providers/registry";

describe("fetchDashboardData", () => {
  it("delegates to the Billa stub provider and returns its DashboardData", async () => {
    const data = await fetchDashboardData(StoreName.Billa, "SK", "Bratislava");
    expect(data).toEqual({
      store: { id: "billa", label: "Billa", dotColor: "#ea580c" },
      categories: [],
      offers: [],
    });
  });

  it("delegates to the Tesco stub provider and returns its DashboardData", async () => {
    const data = await fetchDashboardData(StoreName.Tesco, "SK", "Bratislava");
    expect(data.offers).toEqual([]);
  });

  it("dedupes offers/categories from the provider and recomputes category counts", async () => {
    const spy = vi.spyOn(groceryProviders[StoreName.Billa], "fetch").mockResolvedValueOnce({
      store: { id: "billa", label: "Billa", dotColor: "#ea580c" },
      categories: [
        { id: "dairy", name: "Dairy", count: 99 },
        { id: "DAIRY", name: " dairy ", count: 99 },
      ],
      offers: [
        {
          id: "a",
          title: "Milk 1L",
          subtitle: "",
          categoryId: "dairy",
          regularPrice: 1.5,
          discountedPrice: 1.0,
          discountPercent: 33,
          validFrom: null,
          validUntil: "2026-01-01",
          daysLeft: 1,
          ringPercent: 1,
          imageUrl: null,
        },
        {
          id: "b",
          title: "milk 1l",
          subtitle: "",
          categoryId: "dairy",
          regularPrice: 1.5,
          discountedPrice: 1.0,
          discountPercent: 33,
          validFrom: null,
          validUntil: "2026-01-01",
          daysLeft: 1,
          ringPercent: 1,
          imageUrl: null,
        },
      ],
    });

    const data = await fetchDashboardData(StoreName.Billa, "SK", "Bratislava");

    expect(data.offers.map((o) => o.id)).toEqual(["a"]);
    expect(data.categories).toEqual([{ id: "dairy", name: "Dairy", count: 1 }]);

    spy.mockRestore();
  });
});

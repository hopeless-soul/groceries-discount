import { describe, expect, it } from "vitest";
import { fetchDashboardData } from "./fetchDashboardData";
import { StoreName } from "@/providers/types";

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
});

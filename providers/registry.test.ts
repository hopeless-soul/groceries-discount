import { describe, expect, it } from "vitest";
import { groceryProviders } from "./registry";
import { StoreName } from "./types";

describe("groceryProviders registry", () => {
  it("has all four stores with matching name/label/dotColor", () => {
    expect(groceryProviders[StoreName.Lidl]).toMatchObject({
      name: StoreName.Lidl,
      label: "Lidl",
      dotColor: "#2563eb",
    });
    expect(groceryProviders[StoreName.Kaufland]).toMatchObject({
      name: StoreName.Kaufland,
      label: "Kaufland",
      dotColor: "#dc2626",
    });
    expect(groceryProviders[StoreName.Billa]).toMatchObject({
      name: StoreName.Billa,
      label: "Billa",
      dotColor: "#ea580c",
    });
    expect(groceryProviders[StoreName.Tesco]).toMatchObject({
      name: StoreName.Tesco,
      label: "Tesco",
      dotColor: "#7c3aed",
    });
  });

  it("Billa and Tesco stub providers resolve empty dashboard data", async () => {
    const billaData = await groceryProviders[StoreName.Billa].fetch("SK", "Bratislava");
    expect(billaData).toEqual({
      store: { id: "billa", label: "Billa", dotColor: "#ea580c" },
      categories: [],
      offers: [],
    });

    const tescoData = await groceryProviders[StoreName.Tesco].fetch("SK", "Bratislava");
    expect(tescoData.categories).toEqual([]);
    expect(tescoData.offers).toEqual([]);
  });
});

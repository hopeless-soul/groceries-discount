import { beforeEach, describe, expect, it } from "vitest";
import { useDashboardUiStore } from "./dashboard-ui-store";
import { StoreName } from "@/providers/types";

beforeEach(() => {
  useDashboardUiStore.setState({
    selectedStore: StoreName.Lidl,
    activeCategory: "All",
    cartOpen: true,
  });
});

describe("useDashboardUiStore", () => {
  it("defaults to Lidl / All / cartOpen=true", () => {
    expect(useDashboardUiStore.getState()).toMatchObject({
      selectedStore: StoreName.Lidl,
      activeCategory: "All",
      cartOpen: true,
    });
  });

  it("setSelectedStore resets activeCategory to All", () => {
    useDashboardUiStore.getState().setActiveCategory("Bakery");
    useDashboardUiStore.getState().setSelectedStore(StoreName.Kaufland);
    expect(useDashboardUiStore.getState()).toMatchObject({
      selectedStore: StoreName.Kaufland,
      activeCategory: "All",
    });
  });

  it("toggleCartOpen flips the boolean", () => {
    useDashboardUiStore.getState().toggleCartOpen();
    expect(useDashboardUiStore.getState().cartOpen).toBe(false);
    useDashboardUiStore.getState().toggleCartOpen();
    expect(useDashboardUiStore.getState().cartOpen).toBe(true);
  });
});

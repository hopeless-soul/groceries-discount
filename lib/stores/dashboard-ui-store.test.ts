import { beforeEach, describe, expect, it } from "vitest";
import { useDashboardUiStore } from "./dashboard-ui-store";
import { StoreName } from "@/providers/types";

beforeEach(() => {
  localStorage.clear();
  useDashboardUiStore.setState({
    selectedStore: StoreName.Lidl,
    activeCategory: "All",
    cartOpen: true,
    searchQuery: "",
    showImages: false,
    receiptOpen: false,
  });
});

describe("useDashboardUiStore", () => {
  it("defaults to Lidl / All / cartOpen=true / searchQuery='' / showImages=false", () => {
    expect(useDashboardUiStore.getState()).toMatchObject({
      selectedStore: StoreName.Lidl,
      activeCategory: "All",
      cartOpen: true,
      searchQuery: "",
      showImages: false,
      receiptOpen: false,
    });
  });

  it("toggleReceiptOpen flips the boolean", () => {
    expect(useDashboardUiStore.getState().receiptOpen).toBe(false);
    useDashboardUiStore.getState().toggleReceiptOpen();
    expect(useDashboardUiStore.getState().receiptOpen).toBe(true);
    useDashboardUiStore.getState().toggleReceiptOpen();
    expect(useDashboardUiStore.getState().receiptOpen).toBe(false);
  });

  it("toggleShowImages flips the boolean and persists it across store instances", () => {
    useDashboardUiStore.getState().toggleShowImages();
    expect(useDashboardUiStore.getState().showImages).toBe(true);

    const persisted = JSON.parse(localStorage.getItem("groceries-discount:dashboard-ui") ?? "{}");
    expect(persisted.state).toMatchObject({ showImages: true });

    useDashboardUiStore.getState().toggleShowImages();
    expect(useDashboardUiStore.getState().showImages).toBe(false);
  });

  it("setSearchQuery updates the query", () => {
    useDashboardUiStore.getState().setSearchQuery("bread");
    expect(useDashboardUiStore.getState().searchQuery).toBe("bread");
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

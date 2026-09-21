import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoreList } from "./StoreList";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";

beforeEach(() => {
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
});

describe("StoreList", () => {
  it("renders all four stores", () => {
    render(<StoreList />);
    expect(screen.getByRole("button", { name: /lidl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kaufland/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /billa/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tesco/i })).toBeInTheDocument();
  });

  it("selecting a store updates selectedStore and resets activeCategory", async () => {
    const user = userEvent.setup();
    useDashboardUiStore.setState({ activeCategory: "Bakery" });
    render(<StoreList />);
    await user.click(screen.getByRole("button", { name: /kaufland/i }));
    expect(useDashboardUiStore.getState()).toMatchObject({
      selectedStore: StoreName.Kaufland,
      activeCategory: "All",
    });
  });
});

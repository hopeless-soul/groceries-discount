import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoreList } from "./StoreList";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

beforeEach(() => {
  useDashboardUiStore.setState({ selectedStore: "lidl", activeCategory: "All", cartOpen: true });
});

describe("StoreList", () => {
  it("renders all four stores", () => {
    render(<StoreList statuses={null} />);
    expect(screen.getByRole("button", { name: /lidl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kaufland/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /billa/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tesco/i })).toBeInTheDocument();
  });

  it("selecting a store updates selectedStore and resets activeCategory", async () => {
    const user = userEvent.setup();
    useDashboardUiStore.setState({ activeCategory: "Bakery" });
    render(<StoreList statuses={null} />);
    await user.click(screen.getByRole("button", { name: /kaufland/i }));
    expect(useDashboardUiStore.getState()).toMatchObject({
      selectedStore: "kaufland",
      activeCategory: "All",
    });
  });
});

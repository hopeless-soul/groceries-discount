import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartPanel } from "./CartPanel";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";

const item = {
  id: "o1",
  title: "Milk",
  subtitle: "",
  categoryId: "dairy",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
  imageUrl: null,
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
};

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
});

describe("CartPanel", () => {
  it("shows an empty state and a disabled Clear cart button when empty", () => {
    render(<CartPanel />);
    expect(screen.getByText(/no items/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear cart/i })).toBeDisabled();
  });

  it("lists items and lets Clear cart empty the store", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [item] });
    render(<CartPanel />);
    expect(screen.getByText("Cart · 1")).toBeInTheDocument();
    expect(screen.getByText("Milk")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear cart/i }));
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("removing an item via its row updates the cart", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [item] });
    render(<CartPanel />);
    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("the close button toggles cartOpen off", async () => {
    const user = userEvent.setup();
    render(<CartPanel />);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(useDashboardUiStore.getState().cartOpen).toBe(false);
  });
});

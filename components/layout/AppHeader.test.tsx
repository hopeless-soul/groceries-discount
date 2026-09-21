import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "./AppHeader";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";

const cartItem = {
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
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
};

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({
    selectedStore: StoreName.Lidl,
    activeCategory: "All",
    cartOpen: true,
  });
});

describe("AppHeader", () => {
  it("hides the cart count badge when the cart is empty", () => {
    render(<AppHeader />);
    expect(screen.queryByTestId("cart-count-badge")).not.toBeInTheDocument();
  });

  it("shows the cart count badge when the cart has items", () => {
    useCartStore.setState({ items: [cartItem] });
    render(<AppHeader />);
    expect(screen.getByTestId("cart-count-badge")).toHaveTextContent("1");
  });

  it("toggles cartOpen when the cart button is clicked", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);
    await user.click(screen.getByRole("button", { name: /cart/i }));
    expect(useDashboardUiStore.getState().cartOpen).toBe(false);
  });
});

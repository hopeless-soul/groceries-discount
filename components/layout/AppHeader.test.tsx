import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/actions/searchCities", () => ({
  searchCities: vi.fn().mockResolvedValue([]),
}));

import { AppHeader } from "./AppHeader";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { useLocationStore } from "@/lib/stores/location-store";
import { StoreName } from "@/providers/types";

const cartItem = {
  id: "o1",
  title: "Milk",
  subtitle: "",
  categoryId: "dairy",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validFrom: null,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
  imageUrl: null,
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
};

beforeEach(() => {
  replace.mockClear();
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({
    selectedStore: StoreName.Lidl,
    activeCategory: "All",
    cartOpen: true,
  });
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
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

  it("shows the current city on the location trigger button", () => {
    render(<AppHeader />);
    expect(screen.getByRole("button", { name: /change location/i })).toHaveTextContent(
      "Bratislava",
    );
  });

  it("opens the change-location dialog when the location button is clicked", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: /change location/i }));

    expect(screen.getByRole("combobox", { name: /country/i })).toHaveTextContent("SK");
  });

  it("hides the date below the lg breakpoint", () => {
    render(<AppHeader />);
    const today = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(screen.getByText(today)).toHaveClass("hidden", "lg:inline");
  });
});

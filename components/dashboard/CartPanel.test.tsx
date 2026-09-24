import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartPanel } from "./CartPanel";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";
import { setDesktop } from "@/lib/test-utils/matchMedia";

const item = {
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
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
});

afterEach(() => setDesktop(true));

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

describe("CartPanel on mobile", () => {
  it("auto-closes the drawer on mount even when cartOpen starts true", () => {
    setDesktop(false);
    render(<CartPanel />);
    expect(screen.queryByText(/cart ·/i)).not.toBeInTheDocument();
    expect(useDashboardUiStore.getState().cartOpen).toBe(false);
  });

  it("renders no cart content when cartOpen is false", () => {
    setDesktop(false);
    useDashboardUiStore.setState({ cartOpen: false });
    render(<CartPanel />);
    expect(screen.queryByText(/cart ·/i)).not.toBeInTheDocument();
  });

  it("opens the drawer when cartOpen is toggled on after mount", async () => {
    const user = userEvent.setup();
    setDesktop(false);
    useDashboardUiStore.setState({ cartOpen: false });
    render(<CartPanel />);
    expect(screen.queryByText(/cart ·/i)).not.toBeInTheDocument();

    await act(async () => {
      useDashboardUiStore.getState().toggleCartOpen();
    });
    expect(await screen.findByText("Cart · 0")).toBeInTheDocument();
  });
});

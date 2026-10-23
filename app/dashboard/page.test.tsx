import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useShops = vi.fn();
vi.mock("@/hooks/useShops", () => ({
  useShops: () => useShops(),
}));

const useShopOffers = vi.fn();
const useAllShopOffers = vi.fn();
vi.mock("@/hooks/useShopOffers", () => ({
  useShopOffers: (...args: unknown[]) => useShopOffers(...args),
  useAllShopOffers: (...args: unknown[]) => useAllShopOffers(...args),
}));

vi.mock("@/public/bascet_logo.svg", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import DashboardPage from "./page";

const breadOffer = {
  id: "o1",
  pageId: "p1",
  flyerId: "f1",
  shop: "lidl" as const,
  title: "Bread",
  category: ["bakery" as const],
  basePrice: 2,
  discountedPrice: 1,
  loyaltyPrice: null,
  loyaltyDiscount: null,
  discount: 50,
  validFrom: "2026-09-20",
  validTo: "2099-12-31",
  imageUrl: "https://api.example.com/i",
  isCropped: false,
  boundaryBox: [[0, 0], [1, 1]] as [[number, number], [number, number]],
};

beforeEach(() => {
  localStorage.clear();
  useDashboardUiStore.setState({
    selectedStore: "lidl",
    activeCategory: "All",
    cartOpen: true,
    searchQuery: "",
    showImages: false,
  });
  useShops.mockReturnValue({
    shops: [{ shop: "lidl", name: "Lidl", flyer: { id: "f1", validFrom: "2026-09-20", validTo: "2099-12-31" } }],
    statuses: { lidl: "available", kaufland: "restricted", billa: "restricted", tesco: "restricted" },
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
  useShopOffers.mockReturnValue({ offers: [breadOffer], loading: false, error: null, refetch: vi.fn() });
  useAllShopOffers.mockReturnValue({ offers: [], loading: false, error: null });
});

describe("Dashboard page", () => {
  it("renders stores, categories, offers, and the cart panel", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("button", { name: /lidl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bakery/i })).toBeInTheDocument();
    expect(screen.getByText("Bread")).toBeInTheDocument();
    expect(screen.getByText("Cart · 0")).toBeInTheDocument();
  });

  it("fetches offers only for the selected shop when it is available", () => {
    render(<DashboardPage />);
    expect(useShopOffers).toHaveBeenLastCalledWith("lidl", true);
  });

  it("does not fetch offers for a restricted selected shop", () => {
    useDashboardUiStore.setState({ selectedStore: "kaufland" });
    render(<DashboardPage />);
    expect(useShopOffers).toHaveBeenLastCalledWith("kaufland", false);
  });

  it("hides the cart panel when cartOpen is false", () => {
    useDashboardUiStore.setState({ cartOpen: false });
    render(<DashboardPage />);
    expect(screen.queryByText(/cart ·/i)).not.toBeInTheDocument();
  });

  it("typing into the search box updates the store and shows a clear button", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);
    const input = screen.getByPlaceholderText(/search products/i);

    expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();

    await user.type(input, "bread");

    expect(useDashboardUiStore.getState().searchQuery).toBe("bread");
    expect(screen.getByRole("button", { name: /clear search/i })).toBeInTheDocument();
  });

  it("clicking the clear button resets the search query", async () => {
    useDashboardUiStore.setState({ searchQuery: "bread" });
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(useDashboardUiStore.getState().searchQuery).toBe("");
    expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();
  });

  it("clicking the show images switch toggles showImages in the store", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    expect(useDashboardUiStore.getState().showImages).toBe(false);
    await user.click(screen.getByRole("switch", { name: /show images/i }));
    expect(useDashboardUiStore.getState().showImages).toBe(true);
  });
});

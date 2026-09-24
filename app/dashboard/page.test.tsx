import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const useDashboardData = vi.fn();
vi.mock("@/hooks/useDashboardData", () => ({
  useDashboardData: (...args: unknown[]) => useDashboardData(...args),
}));

const useAllStoresOffers = vi.fn();
vi.mock("@/hooks/useAllStoresOffers", () => ({
  useAllStoresOffers: (...args: unknown[]) => useAllStoresOffers(...args),
}));

import { useLocationStore } from "@/lib/stores/location-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";
import DashboardPage from "./page";

beforeEach(() => {
  replace.mockClear();
  localStorage.clear();
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
  useDashboardUiStore.setState({
    selectedStore: StoreName.Lidl,
    activeCategory: "All",
    cartOpen: true,
    searchQuery: "",
    showImages: false,
  });
  useDashboardData.mockReturnValue({
    data: {
      store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" },
      categories: [{ id: "bakery", name: "Bakery", count: 1 }],
      offers: [
        {
          id: "o1",
          title: "Bread",
          subtitle: "",
          categoryId: "bakery",
          regularPrice: 2,
          discountedPrice: 1,
          discountPercent: 50,
          validFrom: null,
          validUntil: "2026-09-22T00:00:00.000Z",
          daysLeft: 4,
          ringPercent: 50,
          imageUrl: null,
        },
      ],
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
  useAllStoresOffers.mockReset();
  useAllStoresOffers.mockReturnValue({ offers: [], loading: false, error: null });
});

describe("Dashboard page", () => {
  it("redirects to / when no location is saved", () => {
    useLocationStore.setState({ country: null, city: null });
    render(<DashboardPage />);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("renders stores, categories, offers, and the cart panel", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("button", { name: /lidl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bakery/i })).toBeInTheDocument();
    expect(screen.getByText("Bread")).toBeInTheDocument();
    expect(screen.getByText("Cart · 0")).toBeInTheDocument();
  });

  it("hides the cart panel when cartOpen is false", () => {
    useDashboardUiStore.setState({ cartOpen: false });
    render(<DashboardPage />);
    expect(screen.queryByText(/cart ·/i)).not.toBeInTheDocument();
  });

  it("calls useDashboardData exactly once per render, so OfferGrid and CategoryList share a single fetch", () => {
    useDashboardData.mockClear();
    render(<DashboardPage />);
    expect(useDashboardData).toHaveBeenCalledTimes(1);
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

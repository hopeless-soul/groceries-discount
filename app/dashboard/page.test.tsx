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

import { useLocationStore } from "@/lib/stores/location-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";
import DashboardPage from "./page";

beforeEach(() => {
  replace.mockClear();
  localStorage.clear();
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
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
          validUntil: "2026-09-22T00:00:00.000Z",
          daysLeft: 4,
          ringPercent: 50,
        },
      ],
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
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
});

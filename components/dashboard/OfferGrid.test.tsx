import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferGrid } from "./OfferGrid";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { useLocationStore } from "@/lib/stores/location-store";

const useAllStoresOffers = vi.fn();
vi.mock("@/hooks/useAllStoresOffers", () => ({
  useAllStoresOffers: (...args: unknown[]) => useAllStoresOffers(...args),
}));

const offer = (id: string, categoryId: string) => ({
  id,
  title: `Offer ${id}`,
  subtitle: "",
  categoryId,
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
});

beforeEach(() => {
  useDashboardUiStore.setState({ activeCategory: "All", cartOpen: true, searchQuery: "" });
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
  useAllStoresOffers.mockReset();
  useAllStoresOffers.mockReturnValue({ offers: [], loading: false, error: null });
});

describe("OfferGrid", () => {
  it("shows a loading state", () => {
    render(<OfferGrid data={null} loading={true} error={null} refetch={vi.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows an error state with a retry button", async () => {
    const refetch = vi.fn();
    const user = userEvent.setup();
    render(<OfferGrid data={null} loading={false} error={new Error("boom")} refetch={refetch} />);
    expect(screen.getByText(/couldn't load offers/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows an empty state when there are no offers", () => {
    render(
      <OfferGrid
        data={{ store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" }, categories: [], offers: [] }}
        loading={false}
        error={null}
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText(/no offers/i)).toBeInTheDocument();
  });

  it("filters offers by the active category", () => {
    useDashboardUiStore.setState({ activeCategory: "bakery" });
    render(
      <OfferGrid
        data={{
          store: { id: "lidl", label: "Lidl", dotColor: "#2563eb" },
          categories: [{ id: "bakery", name: "Bakery", count: 1 }, { id: "dairy", name: "Dairy", count: 1 }],
          offers: [offer("o1", "bakery"), offer("o2", "dairy")],
        }}
        loading={false}
        error={null}
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText("Offer o1")).toBeInTheDocument();
    expect(screen.queryByText("Offer o2")).not.toBeInTheDocument();
  });

  it("shows a loading state while searching all stores", () => {
    useDashboardUiStore.setState({ searchQuery: "bread" });
    useAllStoresOffers.mockReturnValue({ offers: [], loading: true, error: null });
    render(<OfferGrid data={null} loading={false} error={null} refetch={vi.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows an error state while searching all stores", () => {
    useDashboardUiStore.setState({ searchQuery: "bread" });
    useAllStoresOffers.mockReturnValue({ offers: [], loading: false, error: new Error("boom") });
    render(<OfferGrid data={null} loading={false} error={null} refetch={vi.fn()} />);
    expect(screen.getByText(/couldn't load offers/i)).toBeInTheDocument();
  });

  it("ignores the active category and searches by title/subtitle across all stores", () => {
    useDashboardUiStore.setState({ searchQuery: "sourdough", activeCategory: "dairy" });
    useAllStoresOffers.mockReturnValue({
      offers: [
        { ...offer("o1", "bakery"), title: "Sourdough loaf", storeId: "lidl", storeLabel: "Lidl", storeDotColor: "#2563eb" },
        { ...offer("o2", "dairy"), title: "Milk", subtitle: "sourdough starter kit", storeId: "billa", storeLabel: "Billa", storeDotColor: "#dc2626" },
        { ...offer("o3", "bakery"), title: "Rye bread", storeId: "tesco", storeLabel: "Tesco", storeDotColor: "#059669" },
      ],
      loading: false,
      error: null,
    });
    render(<OfferGrid data={null} loading={false} error={null} refetch={vi.fn()} />);

    expect(screen.getByText("Sourdough loaf")).toBeInTheDocument();
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.queryByText("Rye bread")).not.toBeInTheDocument();
  });

  it("shows a no-match message when the search query matches nothing", () => {
    useDashboardUiStore.setState({ searchQuery: "nonexistent" });
    useAllStoresOffers.mockReturnValue({
      offers: [{ ...offer("o1", "bakery"), storeId: "lidl", storeLabel: "Lidl", storeDotColor: "#2563eb" }],
      loading: false,
      error: null,
    });
    render(<OfferGrid data={null} loading={false} error={null} refetch={vi.fn()} />);
    expect(screen.getByText(/no offers match/i)).toBeInTheDocument();
  });
});

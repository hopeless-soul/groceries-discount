import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferGrid } from "./OfferGrid";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { makeDisplayOffer } from "@/lib/test-utils/fixtures";
import type { ShopStatus } from "@/lib/shops";
import type { ShopKey } from "@/lib/config/shops";

const useAllShopOffers = vi.fn();
vi.mock("@/hooks/useShopOffers", () => ({
  useAllShopOffers: (...args: unknown[]) => useAllShopOffers(...args),
}));

const available: Record<ShopKey, ShopStatus> = {
  lidl: "available",
  kaufland: "available",
  billa: "available",
  tesco: "available",
};

function renderGrid(overrides: Partial<Parameters<typeof OfferGrid>[0]> = {}) {
  const props = {
    selectedStore: "lidl" as ShopKey,
    statuses: available,
    shopsLoading: false,
    shopsError: null,
    refetchShops: vi.fn(),
    offers: [] as ReturnType<typeof makeDisplayOffer>[],
    loading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
  render(<OfferGrid {...props} />);
  return props;
}

beforeEach(() => {
  useDashboardUiStore.setState({ activeCategory: "All", cartOpen: true, searchQuery: "", sortBy: "default" });
  useAllShopOffers.mockReset();
  useAllShopOffers.mockReturnValue({ offers: [], loading: false, error: null });
});

describe("OfferGrid", () => {
  it("shows a loading state", () => {
    renderGrid({ loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows an error state with a retry button", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    renderGrid({ error: new Error("boom"), refetch });
    expect(screen.getByText(/couldn't load offers/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows a shops error with a retry that refetches shops", async () => {
    const user = userEvent.setup();
    const refetchShops = vi.fn();
    renderGrid({ shopsError: new Error("down"), refetchShops, statuses: null });
    expect(screen.getByText(/couldn't load shops/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetchShops).toHaveBeenCalled();
  });

  it("shows the shop's status message instead of offers when it is restricted", () => {
    renderGrid({ statuses: { ...available, lidl: "restricted" } });
    expect(screen.getByText("Shop is restricted.")).toBeInTheDocument();
  });

  it("shows an empty state when there are no offers", () => {
    renderGrid();
    expect(screen.getByText(/no offers/i)).toBeInTheDocument();
  });

  it("renders the offers of the selected shop", () => {
    renderGrid({ offers: [makeDisplayOffer({ id: "o1", displayTitle: "Bread" })] });
    expect(screen.getByText("Bread")).toBeInTheDocument();
  });

  it("searches all available shops and shows notices for unavailable ones", () => {
    useDashboardUiStore.setState({ searchQuery: "bread" });
    useAllShopOffers.mockReturnValue({
      offers: [
        {
          id: "k1",
          pageId: "p",
          flyerId: "f",
          shop: "kaufland",
          title: "Bread",
          category: ["bakery"],
          basePrice: 2,
          discountedPrice: 1,
          loyaltyPrice: null,
          loyaltyDiscount: null,
          discount: 50,
          validFrom: "2026-09-20",
          validTo: "2026-09-30",
          imageUrl: "https://api.example.com/i",
          isCropped: false,
          boundaryBox: [[0, 0], [1, 1]],
        },
      ],
      loading: false,
      error: null,
    });
    renderGrid({ statuses: { ...available, billa: "outdated" } });

    expect(screen.getByText("Billa: Shop's flyer is outdated. Try again later.")).toBeInTheDocument();
    expect(screen.getByText("Bread")).toBeInTheDocument();
    expect(useAllShopOffers).toHaveBeenLastCalledWith(["lidl", "kaufland", "tesco"], true);
  });
});

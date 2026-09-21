import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferGrid } from "./OfferGrid";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

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
  useDashboardUiStore.setState({ activeCategory: "All", cartOpen: true });
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
});

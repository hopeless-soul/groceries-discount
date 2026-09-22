import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { VirtualizedOfferGrid } from "./VirtualizedOfferGrid";
import type { Offer } from "@/lib/types";

function offer(id: string): Offer {
  return {
    id,
    title: `Offer ${id}`,
    subtitle: "",
    categoryId: "cat-1",
    regularPrice: 2,
    discountedPrice: 1,
    discountPercent: 50,
    validUntil: "2026-09-22T00:00:00.000Z",
    daysLeft: 4,
    ringPercent: 50,
    imageUrl: null,
  };
}

describe("VirtualizedOfferGrid", () => {
  it("only mounts a windowed subset of cards for a large offer list", () => {
    const offers = Array.from({ length: 200 }, (_, i) => offer(String(i)));

    render(
      <VirtualizedOfferGrid
        offers={offers}
        getKey={(o) => o.id}
        getStoreProps={() => ({ storeId: "lidl", storeLabel: "Lidl", storeDotColor: "#2563eb" })}
      />,
    );

    const mountedButtons = screen.getAllByRole("button", { name: /add to cart/i });
    expect(mountedButtons.length).toBeGreaterThan(0);
    expect(mountedButtons.length).toBeLessThan(offers.length);
  });
});

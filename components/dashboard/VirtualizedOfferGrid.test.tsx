import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VirtualizedOfferGrid } from "./VirtualizedOfferGrid";
import type { Offer } from "@/lib/types";
import { setDesktop } from "@/lib/test-utils/matchMedia";

function setPhone(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(max-width: 767px)" ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

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

afterEach(() => setDesktop(true));

describe("VirtualizedOfferGrid", () => {
  it("renders 2 columns per row on phone widths", () => {
    setPhone(true);
    const offers = Array.from({ length: 6 }, (_, i) => offer(String(i)));

    render(
      <VirtualizedOfferGrid
        offers={offers}
        getKey={(o) => o.id}
        getStoreProps={() => ({ storeId: "lidl", storeLabel: "Lidl", storeDotColor: "#2563eb" })}
      />,
    );

    expect(document.querySelector(".grid-cols-2")).toBeInTheDocument();
    expect(document.querySelector(".grid-cols-3")).not.toBeInTheDocument();
  });

  it("renders 3 columns per row above phone widths", () => {
    setPhone(false);
    const offers = Array.from({ length: 6 }, (_, i) => offer(String(i)));

    render(
      <VirtualizedOfferGrid
        offers={offers}
        getKey={(o) => o.id}
        getStoreProps={() => ({ storeId: "lidl", storeLabel: "Lidl", storeDotColor: "#2563eb" })}
      />,
    );

    expect(document.querySelector(".grid-cols-3")).toBeInTheDocument();
    expect(document.querySelector(".grid-cols-2")).not.toBeInTheDocument();
  });

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

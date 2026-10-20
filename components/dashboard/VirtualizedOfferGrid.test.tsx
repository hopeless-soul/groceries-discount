import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VirtualizedOfferGrid } from "./VirtualizedOfferGrid";
import { makeDisplayOffer } from "@/lib/test-utils/fixtures";
import { setDesktop } from "@/lib/test-utils/matchMedia";

function setPhone(matches: boolean, wide = false) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(max-width: 767px)" ? matches : query === "(min-width: 1536px)" && wide,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function offers(count: number) {
  return Array.from({ length: count }, (_, i) =>
    makeDisplayOffer({ id: String(i), displayTitle: `Offer ${i}` }),
  );
}

afterEach(() => setDesktop(true));

describe("VirtualizedOfferGrid", () => {
  it("renders 2 columns per row on phone widths", () => {
    setPhone(true);
    render(<VirtualizedOfferGrid offers={offers(6)} />);

    expect(document.querySelector(".grid-cols-2")).toBeInTheDocument();
    expect(document.querySelector(".grid-cols-3")).not.toBeInTheDocument();
  });

  it("renders 3 columns per row above phone widths", () => {
    setPhone(false);
    render(<VirtualizedOfferGrid offers={offers(6)} />);

    expect(document.querySelector(".grid-cols-3")).toBeInTheDocument();
    expect(document.querySelector(".grid-cols-2")).not.toBeInTheDocument();
  });

  it("renders 4 columns per row on the widest screens", () => {
    setPhone(false, true);
    render(<VirtualizedOfferGrid offers={offers(8)} />);

    expect(document.querySelector(".grid-cols-4")).toBeInTheDocument();
    expect(document.querySelector(".grid-cols-3")).not.toBeInTheDocument();
  });

  it("only mounts a windowed subset of cards for a large offer list", () => {
    const list = offers(200);
    render(<VirtualizedOfferGrid offers={list} />);

    const mountedButtons = screen.getAllByRole("button", { name: /add to cart/i });
    expect(mountedButtons.length).toBeGreaterThan(0);
    expect(mountedButtons.length).toBeLessThan(list.length);
  });
});

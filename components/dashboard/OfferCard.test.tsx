import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferCard } from "./OfferCard";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

const offer = {
  id: "o1",
  title: "Milk",
  subtitle: "1 l",
  categoryId: "dairy",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validFrom: null,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
  imageUrl: null,
};

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({ showImages: false });
});

describe("OfferCard", () => {
  it("shows price, discount pill, and an outline Add to cart button when not in cart", () => {
    render(<OfferCard offer={offer} storeId="lidl" storeLabel="Lidl" storeDotColor="#2563eb" />);
    expect(screen.getByText("-50%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("adds the offer to the cart on click and flips to In cart", async () => {
    const user = userEvent.setup();
    render(<OfferCard offer={offer} storeId="lidl" storeLabel="Lidl" storeDotColor="#2563eb" />);
    await user.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]).toMatchObject({ id: "o1", storeId: "lidl" });
    expect(screen.getByRole("button", { name: /in cart/i })).toBeInTheDocument();
  });

  it("removes the offer from the cart when clicked again", async () => {
    const user = userEvent.setup();
    render(<OfferCard offer={offer} storeId="lidl" storeLabel="Lidl" storeDotColor="#2563eb" />);
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await user.click(screen.getByRole("button", { name: /in cart/i }));

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("renders the offer image when showImages is on and imageUrl is present", () => {
    useDashboardUiStore.setState({ showImages: true });
    render(
      <OfferCard
        offer={{ ...offer, imageUrl: "https://kaufland.media.schwarz/is/image/schwarz/00138945_P" }}
        storeId="lidl"
        storeLabel="Lidl"
        storeDotColor="#2563eb"
      />,
    );
    expect(screen.getByRole("img", { name: "Milk" })).toBeInTheDocument();
  });

  it("hides the offer image when showImages is off, even if imageUrl is present", () => {
    useDashboardUiStore.setState({ showImages: false });
    render(
      <OfferCard
        offer={{ ...offer, imageUrl: "https://kaufland.media.schwarz/is/image/schwarz/00138945_P" }}
        storeId="lidl"
        storeLabel="Lidl"
        storeDotColor="#2563eb"
      />,
    );
    expect(screen.queryByRole("img", { name: "Milk" })).not.toBeInTheDocument();
  });
});

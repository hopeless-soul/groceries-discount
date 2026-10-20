import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferCard } from "./OfferCard";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { makeDisplayOffer } from "@/lib/test-utils/fixtures";

const offer = makeDisplayOffer({ displayTitle: "Milk", displaySubtitle: "1 l" });

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({ showImages: false });
});

describe("OfferCard", () => {
  it("shows price, discount pill, and an outline Add to cart button when not in cart", () => {
    render(<OfferCard offer={offer} />);
    expect(screen.getByText("-50%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("adds the offer to the cart on click and flips to In cart", async () => {
    const user = userEvent.setup();
    render(<OfferCard offer={offer} />);
    await user.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]).toMatchObject({ id: "o1", shop: "lidl" });
    expect(screen.getByRole("button", { name: /in cart/i })).toBeInTheDocument();
  });

  it("removes the offer from the cart when clicked again", async () => {
    const user = userEvent.setup();
    render(<OfferCard offer={offer} />);
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await user.click(screen.getByRole("button", { name: /in cart/i }));

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("renders the full image when showImages is on and the offer is not cropped", () => {
    useDashboardUiStore.setState({ showImages: true });
    render(<OfferCard offer={{ ...offer, isCropped: false }} />);
    expect(screen.getByRole("img", { name: "Milk" })).toBeInTheDocument();
  });

  it("renders the cropped region when showImages is on and the offer is cropped", () => {
    useDashboardUiStore.setState({ showImages: true });
    render(<OfferCard offer={{ ...offer, isCropped: true, boundaryBox: [[0.1, 0.2], [0.4, 0.5]] }} />);
    expect(screen.getByRole("img", { name: "Milk" })).toBeInTheDocument();
  });

  it("opens a preview popup with the offer but no cart button when the image is clicked", async () => {
    useDashboardUiStore.setState({ showImages: true });
    const user = userEvent.setup();
    render(<OfferCard offer={{ ...offer, isCropped: false }} />);
    await user.click(screen.getByRole("button", { name: "Preview image" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Milk")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /add to cart/i })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("hides the offer image when showImages is off, even if imageUrl is present", () => {
    useDashboardUiStore.setState({ showImages: false });
    render(<OfferCard offer={{ ...offer, isCropped: false }} />);
    expect(screen.queryByRole("img", { name: "Milk" })).not.toBeInTheDocument();
  });
});

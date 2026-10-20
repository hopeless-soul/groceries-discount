import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiptOverlay } from "./ReceiptOverlay";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { makeDisplayOffer } from "@/lib/test-utils/fixtures";

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({ receiptOpen: false });
});

describe("ReceiptOverlay", () => {
  it("renders nothing when the cart is empty, even if receiptOpen is true", () => {
    useDashboardUiStore.setState({ receiptOpen: true });
    render(<ReceiptOverlay />);
    expect(screen.queryByText(/grand total/i)).not.toBeInTheDocument();
  });

  it("renders nothing when receiptOpen is false", () => {
    useCartStore.setState({ items: [makeDisplayOffer()] });
    render(<ReceiptOverlay />);
    expect(screen.queryByText(/grand total/i)).not.toBeInTheDocument();
  });

  it("groups items by store and shows subtotals, savings, and grand total", () => {
    const lidlItem = makeDisplayOffer({ id: "o1", shop: "lidl", basePrice: 2, discountedPrice: 1 });
    const kauflandItem = makeDisplayOffer({
      id: "o2",
      shop: "kaufland",
      basePrice: 10,
      discountedPrice: 8,
    });
    useCartStore.setState({ items: [lidlItem, kauflandItem] });
    useDashboardUiStore.setState({ receiptOpen: true });

    render(<ReceiptOverlay />);

    expect(screen.getByText("LIDL")).toBeInTheDocument();
    expect(screen.getByText("KAUFLAND")).toBeInTheDocument();
    expect(screen.getAllByText("Milk").length).toBe(2);
    expect(screen.getByText(/grand total/i)).toBeInTheDocument();
    expect(screen.getByText("9.00")).toBeInTheDocument();
    expect(screen.getByText(/total saved/i)).toBeInTheDocument();
    expect(screen.getByText("3.00")).toBeInTheDocument();
  });

  it("closing via the close button toggles receiptOpen off", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [makeDisplayOffer()] });
    useDashboardUiStore.setState({ receiptOpen: true });
    render(<ReceiptOverlay />);

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(useDashboardUiStore.getState().receiptOpen).toBe(false);
  });
});

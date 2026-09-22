import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiptButton } from "./ReceiptButton";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

const item = {
  id: "o1",
  title: "Milk",
  subtitle: "",
  categoryId: "dairy",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
  imageUrl: null,
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
};

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
  useDashboardUiStore.setState({ receiptOpen: false });
});

describe("ReceiptButton", () => {
  it("renders nothing when the cart is empty", () => {
    render(<ReceiptButton />);
    expect(screen.queryByRole("button", { name: /view receipt/i })).not.toBeInTheDocument();
  });

  it("shows a count badge and toggles receiptOpen when clicked", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [item] });
    render(<ReceiptButton />);

    const button = screen.getByRole("button", { name: /view receipt/i });
    expect(button).toHaveTextContent("1");

    await user.click(button);
    expect(useDashboardUiStore.getState().receiptOpen).toBe(true);
  });
});

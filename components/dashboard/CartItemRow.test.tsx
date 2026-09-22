import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartItemRow } from "./CartItemRow";

const item = {
  id: "o1",
  title: "Milk",
  subtitle: "1 l",
  categoryId: "dairy",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 1,
  ringPercent: 95,
  imageUrl: null,
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
};

describe("CartItemRow", () => {
  it("renders title, store, and price details", () => {
    render(<CartItemRow item={item} onRemove={vi.fn()} />);
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.getByText("Lidl")).toBeInTheDocument();
    expect(screen.getByText("-50%")).toBeInTheDocument();
  });

  it("uses urgency red for a 1-day-left item's valid-until text", () => {
    render(<CartItemRow item={item} onRemove={vi.fn()} />);
    expect(screen.getByTestId("cart-item-valid-until")).toHaveStyle({ color: "#dc2626" });
  });

  it("calls onRemove with the item id", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<CartItemRow item={item} onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith("o1");
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QrCardItem } from "./QrCardItem";

const card = { id: "1", shop: "lidl" as const, name: "lidl card #1", value: "634009509005331837" };

describe("QrCardItem", () => {
  it("shows shop, name, shop color and a QR code by default", () => {
    render(<QrCardItem card={card} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Lidl")).toBeInTheDocument();
    expect(screen.getByText("lidl card #1")).toBeInTheDocument();
    expect(screen.getByTestId("shop-dot")).toHaveStyle({ backgroundColor: "#2563eb" });
    expect(screen.getByTestId("qr-code")).toBeInTheDocument();
    expect(screen.queryByTestId("barcode")).not.toBeInTheDocument();
  });

  it("switches to the barcode and back", async () => {
    const user = userEvent.setup();
    render(<QrCardItem card={card} onEdit={() => {}} onDelete={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Barcode" }));
    expect(screen.getByTestId("barcode")).toBeInTheDocument();
    expect(screen.queryByTestId("qr-code")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "QR" }));
    expect(screen.getByTestId("qr-code")).toBeInTheDocument();
  });

  it("calls onEdit and onDelete", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<QrCardItem card={card} onEdit={onEdit} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: "Edit lidl card #1" }));
    await user.click(screen.getByRole("button", { name: "Delete lidl card #1" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

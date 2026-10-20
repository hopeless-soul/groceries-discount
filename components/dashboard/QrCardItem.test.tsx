import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QrCardItem, type CodeMode } from "./QrCardItem";

const card = { id: "1", shop: "lidl" as const, name: "lidl card #1", value: "634009509005331837" };

function Harness({ onEdit = () => {}, onDelete = () => {} }: { onEdit?: () => void; onDelete?: () => void }) {
  const [mode, setMode] = useState<CodeMode>("qr");
  return <QrCardItem card={card} mode={mode} onModeChange={setMode} onEdit={onEdit} onDelete={onDelete} />;
}

describe("QrCardItem", () => {
  it("shows shop, name, shop color and a QR code by default", () => {
    render(<Harness />);
    expect(screen.getByText("Lidl")).toBeInTheDocument();
    expect(screen.getByText("lidl card #1")).toBeInTheDocument();
    expect(screen.getByTestId("shop-dot")).toHaveStyle({ backgroundColor: "#2563eb" });
    expect(screen.getByTestId("qr-code")).toBeInTheDocument();
    expect(screen.queryByTestId("barcode")).not.toBeInTheDocument();
  });

  it("toggles between QR and barcode on each click of the switch", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole("switch", { name: "Barcode" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("barcode")).toBeInTheDocument();
    expect(screen.queryByTestId("qr-code")).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("qr-code")).toBeInTheDocument();
  });

  it("asks for the opposite mode and shows the mode it is given", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(<QrCardItem card={card} mode="barcode" onModeChange={onModeChange} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByTestId("barcode")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Barcode" }));
    expect(onModeChange).toHaveBeenCalledWith("qr");
  });

  it("calls onEdit and onDelete", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<Harness onEdit={onEdit} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: "Edit lidl card #1" }));
    await user.click(screen.getByRole("button", { name: "Delete lidl card #1" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

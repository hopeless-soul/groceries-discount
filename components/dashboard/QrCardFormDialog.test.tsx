import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./QrImageCropper", () => ({
  QrImageCropper: ({ onBack, onConfirm }: { onBack: () => void; onConfirm: (v: string) => void }) => (
    <div>
      <button onClick={onBack}>Back</button>
      <button onClick={() => onConfirm("decoded-value")}>Confirm</button>
    </div>
  ),
}));

import { QrCardFormDialog } from "./QrCardFormDialog";
import { useQrCardsStore } from "@/lib/stores/qr-cards-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

const file = () => new File(["x"], "c.png", { type: "image/png" });

beforeEach(() => {
  localStorage.clear();
  useQrCardsStore.setState({ cards: [] });
  useDashboardUiStore.setState({ selectedStore: "lidl" });
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
});

describe("QrCardFormDialog", () => {
  it("prefills the name from the selected shop and its card count", () => {
    useQrCardsStore.setState({
      cards: [
        { id: "1", shop: "lidl", name: "a", value: "1" },
        { id: "2", shop: "lidl", name: "b", value: "2" },
      ],
    });
    render(<QrCardFormDialog card={null} onClose={() => {}} />);
    expect(screen.getByLabelText("Name")).toHaveValue("lidl card #3");
  });

  it("requires an image when creating", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<QrCardFormDialog card={null} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Choose an image of the code.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("goes to the crop step, keeps fields on Back, and saves the decoded value", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<QrCardFormDialog card={null} onClose={onClose} />);

    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "my lidl card");
    await user.upload(screen.getByLabelText(/qr \/ barcode image/i), file());

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Name")).toHaveValue("my lidl card");

    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(useQrCardsStore.getState().cards).toMatchObject([
      { shop: "lidl", name: "my lidl card", value: "decoded-value" },
    ]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("edits name without a new image and keeps the value", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    useQrCardsStore.setState({ cards: [{ id: "1", shop: "billa", name: "old", value: "keep-me" }] });
    render(<QrCardFormDialog card={useQrCardsStore.getState().cards[0]} onClose={onClose} />);

    expect(screen.getByRole("heading", { name: "Edit card" })).toBeInTheDocument();
    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "new");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(useQrCardsStore.getState().cards).toMatchObject([{ id: "1", shop: "billa", name: "new", value: "keep-me" }]);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

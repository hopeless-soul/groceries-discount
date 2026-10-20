import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QrListDialog } from "./QrListDialog";
import { useQrCardsStore } from "@/lib/stores/qr-cards-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

const card = { id: "1", shop: "lidl" as const, name: "lidl card #1", value: "634009509005331837" };

beforeEach(() => {
  localStorage.clear();
  useQrCardsStore.setState({ cards: [] });
  useDashboardUiStore.setState({ qrOpen: false, selectedStore: "lidl" });
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
});

describe("QrListDialog", () => {
  it("renders nothing while closed", () => {
    render(<QrListDialog />);
    expect(screen.queryByText("My cards")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no cards", () => {
    useDashboardUiStore.setState({ qrOpen: true });
    render(<QrListDialog />);
    expect(screen.getByText("No cards yet")).toBeInTheDocument();
  });

  it("lists saved cards", () => {
    useQrCardsStore.setState({ cards: [card] });
    useDashboardUiStore.setState({ qrOpen: true });
    render(<QrListDialog />);
    expect(screen.getByText("lidl card #1")).toBeInTheDocument();
  });

  it("closes when the empty space is clicked, but not when a child is", async () => {
    const user = userEvent.setup();
    useQrCardsStore.setState({ cards: [card] });
    useDashboardUiStore.setState({ qrOpen: true });
    render(<QrListDialog />);

    await user.click(screen.getByText("lidl card #1"));
    expect(useDashboardUiStore.getState().qrOpen).toBe(true);

    await user.click(screen.getByTestId("qr-overlay"));
    expect(useDashboardUiStore.getState().qrOpen).toBe(false);
  });

  it("opens the form to add and to edit", async () => {
    const user = userEvent.setup();
    useQrCardsStore.setState({ cards: [card] });
    useDashboardUiStore.setState({ qrOpen: true });
    render(<QrListDialog />);

    await user.click(screen.getByRole("button", { name: "Add card" }));
    expect(screen.getByRole("heading", { name: "New card" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "New card" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit lidl card #1" }));
    expect(screen.getByRole("heading", { name: "Edit card" })).toBeInTheDocument();
  });

  it("switches every card between QR and barcode together", async () => {
    const user = userEvent.setup();
    useQrCardsStore.setState({
      cards: [card, { id: "2", shop: "tesco" as const, name: "tesco card #1", value: "1234567890" }],
    });
    useDashboardUiStore.setState({ qrOpen: true });
    render(<QrListDialog />);
    expect(screen.getAllByTestId("qr-code")).toHaveLength(2);

    await user.click(screen.getAllByRole("switch", { name: "Barcode" })[0]);
    expect(screen.getAllByTestId("barcode")).toHaveLength(2);
    expect(screen.queryByTestId("qr-code")).not.toBeInTheDocument();
    screen.getAllByRole("switch", { name: "Barcode" }).forEach((s) => expect(s).toHaveAttribute("aria-checked", "true"));
  });

  it("deletes a card", async () => {
    const user = userEvent.setup();
    useQrCardsStore.setState({ cards: [card] });
    useDashboardUiStore.setState({ qrOpen: true });
    render(<QrListDialog />);
    await user.click(screen.getByRole("button", { name: "Delete lidl card #1" }));
    expect(useQrCardsStore.getState().cards).toEqual([]);
  });
});

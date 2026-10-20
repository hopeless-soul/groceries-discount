import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QrButton } from "./QrButton";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

beforeEach(() => useDashboardUiStore.setState({ qrOpen: false }));

describe("QrButton", () => {
  it("toggles qrOpen when clicked", async () => {
    const user = userEvent.setup();
    render(<QrButton />);
    await user.click(screen.getByRole("button", { name: /show qr code/i }));
    expect(useDashboardUiStore.getState().qrOpen).toBe(true);
  });
});

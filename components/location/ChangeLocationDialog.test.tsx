import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/actions/searchCities", () => ({
  searchCities: vi.fn().mockResolvedValue([]),
}));

import { useLocationStore } from "@/lib/stores/location-store";
import { ChangeLocationDialog } from "./ChangeLocationDialog";

beforeEach(() => {
  replace.mockClear();
  localStorage.clear();
  useLocationStore.setState({ country: "SK", city: "Bratislava" });
});

describe("ChangeLocationDialog", () => {
  it("does not render its contents when closed", () => {
    render(<ChangeLocationDialog open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /continue/i })).not.toBeInTheDocument();
  });

  it("prefills the current country and city when open", () => {
    render(<ChangeLocationDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("combobox", { name: /country/i })).toHaveTextContent("SK");
    expect(screen.getByRole("combobox", { name: /city/i })).toHaveValue("Bratislava");
  });

  it("saves the new location, closes, and redirects to /dashboard on submit", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ChangeLocationDialog open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(useLocationStore.getState()).toMatchObject({ country: "SK", city: "Bratislava" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });
});

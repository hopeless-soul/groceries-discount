import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { useLocationStore } from "@/lib/stores/location-store";
import Page from "./page";

beforeEach(() => {
  replace.mockClear();
  localStorage.clear();
  useLocationStore.setState({ country: null, city: null });
});

describe("Home page", () => {
  it("redirects to /dashboard when a location is already saved", () => {
    useLocationStore.setState({ country: "SK", city: "Bratislava" });
    render(<Page />);
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the location card and saves+navigates on submit", async () => {
    const user = userEvent.setup();
    render(<Page />);
    expect(replace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    await user.click(screen.getByRole("combobox", { name: /city/i }));
    await user.click(await screen.findByRole("option", { name: "Bratislava" }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(useLocationStore.getState()).toMatchObject({ country: "SK", city: "Bratislava" });
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });
});

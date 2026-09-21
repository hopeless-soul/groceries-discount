import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationSelectCard } from "./LocationSelectCard";

describe("LocationSelectCard", () => {
  it("disables Continue until both country and city are chosen", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LocationSelectCard onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: /city/i }));
    await user.click(await screen.findByRole("option", { name: "Bratislava" }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("calls onSubmit with the chosen country code and city on Continue", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LocationSelectCard onSubmit={onSubmit} />);

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    await user.click(screen.getByRole("combobox", { name: /city/i }));
    await user.click(await screen.findByRole("option", { name: "Bratislava" }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith("SK", "Bratislava");
  });

  it("disables the City select until a country is chosen", () => {
    render(<LocationSelectCard onSubmit={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: /city/i })).toBeDisabled();
  });
});

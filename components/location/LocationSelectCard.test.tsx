import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationSelectCard } from "./LocationSelectCard";
import { searchCities } from "@/lib/actions/searchCities";

vi.mock("@/lib/actions/searchCities", () => ({
  searchCities: vi.fn(),
}));

const mockedSearchCities = vi.mocked(searchCities);

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockedSearchCities.mockReset();
  mockedSearchCities.mockResolvedValue(["Bratislava"]);
});

afterEach(() => {
  vi.useRealTimers();
});

async function pickCity(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByRole("combobox", { name: /city/i }), text);
  await act(async () => {
    vi.advanceTimersByTime(400);
  });
  await user.click(await screen.findByRole("option", { name: "Bratislava" }));
}

describe("LocationSelectCard", () => {
  it("disables Continue until both country and city are chosen", async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    const onSubmit = vi.fn();
    render(<LocationSelectCard onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await pickCity(user, "Brat");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("calls onSubmit with the chosen country code and city on Continue", async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    const onSubmit = vi.fn();
    render(<LocationSelectCard onSubmit={onSubmit} />);

    await user.click(screen.getByRole("combobox", { name: /country/i }));
    await user.click(await screen.findByRole("option", { name: "Slovakia" }));
    await pickCity(user, "Brat");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith("SK", "Bratislava");
  });

  it("disables the City field until a country is chosen", () => {
    render(<LocationSelectCard onSubmit={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: /city/i })).toBeDisabled();
  });

  it("prefills country and city from initialCountry/initialCity", () => {
    render(
      <LocationSelectCard onSubmit={vi.fn()} initialCountry="SK" initialCity="Bratislava" />,
    );

    expect(screen.getByRole("combobox", { name: /country/i })).toHaveTextContent("SK");
    expect(screen.getByRole("combobox", { name: /city/i })).toHaveValue("Bratislava");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });
});

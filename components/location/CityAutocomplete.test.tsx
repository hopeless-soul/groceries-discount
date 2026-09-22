import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CityAutocomplete } from "./CityAutocomplete";
import { searchCities } from "@/lib/actions/searchCities";

vi.mock("@/lib/actions/searchCities", () => ({
  searchCities: vi.fn(),
}));

const mockedSearchCities = vi.mocked(searchCities);

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockedSearchCities.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CityAutocomplete", () => {
  it("is disabled when no country is selected", () => {
    render(<CityAutocomplete countryCode={null} value={null} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: /city/i })).toBeDisabled();
  });

  it("waits 400ms after typing stops before calling searchCities", async () => {
    mockedSearchCities.mockResolvedValue(["Trencin"]);
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    render(<CityAutocomplete countryCode="SK" value={null} onChange={vi.fn()} />);

    await user.type(screen.getByRole("combobox", { name: /city/i }), "Tr");
    expect(mockedSearchCities).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(mockedSearchCities).toHaveBeenCalledWith("Tr", "SK");
  });

  it("only calls searchCities once after rapid typing", async () => {
    mockedSearchCities.mockResolvedValue(["Trencin"]);
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    render(<CityAutocomplete countryCode="SK" value={null} onChange={vi.fn()} />);

    const input = screen.getByRole("combobox", { name: /city/i });
    await user.type(input, "T");
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await user.type(input, "r");
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await user.type(input, "e");
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(mockedSearchCities).toHaveBeenCalledTimes(1);
    expect(mockedSearchCities).toHaveBeenCalledWith("Tre", "SK");
  });

  it("shows suggestions and calls onChange when one is selected", async () => {
    mockedSearchCities.mockResolvedValue(["Trencin", "Trencianske Teplice"]);
    const onChange = vi.fn();
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    render(<CityAutocomplete countryCode="SK" value={null} onChange={onChange} />);

    await user.type(screen.getByRole("combobox", { name: /city/i }), "Tr");
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    const option = await screen.findByRole("option", { name: "Trencin" });
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith("Trencin");
  });

  it("clears the selected city when the text is edited afterward", async () => {
    mockedSearchCities.mockResolvedValue([]);
    const onChange = vi.fn();
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    render(<CityAutocomplete countryCode="SK" value="Trencin" onChange={onChange} />);

    await user.type(screen.getByRole("combobox", { name: /city/i }), "x");

    expect(onChange).toHaveBeenCalledWith(null);
  });
});

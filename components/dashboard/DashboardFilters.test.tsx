import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardFilters } from "./DashboardFilters";
import { setDesktop } from "@/lib/test-utils/matchMedia";

function renderFilters(overrides: Partial<React.ComponentProps<typeof DashboardFilters>> = {}) {
  const props = {
    showImages: false,
    toggleShowImages: vi.fn(),
    sortBy: "default" as const,
    setSortBy: vi.fn(),
    ...overrides,
  };
  render(<DashboardFilters {...props} />);
  return props;
}

afterEach(() => setDesktop(true));

describe("DashboardFilters", () => {
  it("renders the switch and sort select directly on desktop", () => {
    setDesktop(true);
    renderFilters();
    expect(screen.getByRole("switch", { name: /show images/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /sort by/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /filters/i })).not.toBeInTheDocument();
  });

  it("toggling the switch on desktop calls toggleShowImages", async () => {
    setDesktop(true);
    const user = userEvent.setup();
    const { toggleShowImages } = renderFilters();
    await user.click(screen.getByRole("switch", { name: /show images/i }));
    expect(toggleShowImages).toHaveBeenCalledOnce();
  });

  it("hides the controls behind a Filters button on mobile, opened on click", async () => {
    setDesktop(false);
    const user = userEvent.setup();
    renderFilters();

    expect(screen.queryByRole("switch", { name: /show images/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /filters/i }));

    expect(await screen.findByRole("switch", { name: /show images/i })).toBeInTheDocument();
  });
});

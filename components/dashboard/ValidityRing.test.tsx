import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValidityRing } from "./ValidityRing";

describe("ValidityRing", () => {
  it("renders the days-left count", () => {
    render(<ValidityRing ringPercent={50} daysLeft={4} />);
    expect(screen.getByText("4d")).toBeInTheDocument();
  });

  it("uses the dark color when more than 3 days remain", () => {
    render(<ValidityRing ringPercent={50} daysLeft={4} />);
    const circle = screen.getByTestId("validity-ring-progress");
    expect(circle).toHaveAttribute("stroke", "#18181b");
  });

  it("uses red when 1 day or fewer remain", () => {
    render(<ValidityRing ringPercent={95} daysLeft={1} />);
    const circle = screen.getByTestId("validity-ring-progress");
    expect(circle).toHaveAttribute("stroke", "#dc2626");
    expect(screen.getByText("1d")).toHaveStyle({ color: "#dc2626" });
  });
});

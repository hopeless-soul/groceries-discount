import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/public/bascet_logo.svg", () => ({ default: () => null }));

import Page from "./page";

describe("Home page", () => {
  it("introduces the app and links to the dashboard", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Your grocery discounts, sorted and ready to shop.",
    );
    expect(screen.getByText("Slovakia")).toBeInTheDocument();
    expect(screen.getByText("Discounts aggregator")).toBeInTheDocument();
    expect(screen.getByText("Pick the stores you shop at")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/dashboard");
  });
});

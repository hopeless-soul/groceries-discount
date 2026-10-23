import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardSidebar } from "./DashboardSidebar";

vi.mock("@/public/bascet_logo.svg", () => ({ default: () => null }));
// anime.js text splitting needs document.fonts, which jsdom lacks.
vi.mock("@/components/home/AnimatedHeadline", () => ({
  AnimatedHeadline: ({ children, className }: { children: string; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { setDesktop } from "@/lib/test-utils/matchMedia";

const categories = [{ id: "bakery", name: "Bakery", count: 1 }];

beforeEach(() => {
  useDashboardUiStore.setState({ selectedStore: "lidl", activeCategory: "All", cartOpen: true });
});

afterEach(() => setDesktop(true));

describe("DashboardSidebar", () => {
  it("renders stores and categories directly on desktop, with no menu trigger", () => {
    setDesktop(true);
    render(<DashboardSidebar categories={categories} totalCount={1} statuses={null} />);
    expect(screen.getByRole("button", { name: /lidl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bakery/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open menu/i })).not.toBeInTheDocument();
  });

  it("hides stores/categories behind a menu trigger on mobile, opened on click", async () => {
    setDesktop(false);
    const user = userEvent.setup();
    render(<DashboardSidebar categories={categories} totalCount={1} statuses={null} />);

    expect(screen.queryByRole("button", { name: /^lidl$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(await screen.findByRole("button", { name: /lidl/i })).toBeInTheDocument();
  });
});

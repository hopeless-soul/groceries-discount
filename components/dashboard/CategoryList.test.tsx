import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryList } from "./CategoryList";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { StoreName } from "@/providers/types";

const categories = [
  { id: "bakery", name: "Bakery", count: 3 },
  { id: "dairy", name: "Dairy & Eggs", count: 2 },
];

beforeEach(() => {
  useDashboardUiStore.setState({ selectedStore: StoreName.Lidl, activeCategory: "All", cartOpen: true });
});

describe("CategoryList", () => {
  it("renders an All row with the total count plus each category", () => {
    render(<CategoryList categories={categories} totalCount={5} />);
    expect(screen.getByRole("button", { name: /all/i })).toHaveTextContent("5");
    expect(screen.getByRole("button", { name: /bakery/i })).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: /dairy & eggs/i })).toHaveTextContent("2");
  });

  it("selecting a category updates activeCategory", async () => {
    const user = userEvent.setup();
    render(<CategoryList categories={categories} totalCount={5} />);
    await user.click(screen.getByRole("button", { name: /bakery/i }));
    expect(useDashboardUiStore.getState().activeCategory).toBe("bakery");
  });
});

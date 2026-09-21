import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cart-store";
import type { CartItem } from "@/lib/types";

const item = (id: string): CartItem => ({
  id,
  title: `Offer ${id}`,
  subtitle: "",
  categoryId: "cat-1",
  regularPrice: 2,
  discountedPrice: 1,
  discountPercent: 50,
  validUntil: "2026-09-22T00:00:00.000Z",
  daysLeft: 4,
  ringPercent: 50,
  storeId: "lidl",
  storeLabel: "Lidl",
  storeDotColor: "#2563eb",
});

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
});

describe("useCartStore", () => {
  it("starts empty", () => {
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("add appends an item and has() reflects membership", () => {
    useCartStore.getState().add(item("o1"));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().has("o1")).toBe(true);
    expect(useCartStore.getState().has("o2")).toBe(false);
  });

  it("add preserves add-order across multiple items", () => {
    useCartStore.getState().add(item("o1"));
    useCartStore.getState().add(item("o2"));
    expect(useCartStore.getState().items.map((i) => i.id)).toEqual(["o1", "o2"]);
  });

  it("remove drops one item by id", () => {
    useCartStore.getState().add(item("o1"));
    useCartStore.getState().add(item("o2"));
    useCartStore.getState().remove("o1");
    expect(useCartStore.getState().items.map((i) => i.id)).toEqual(["o2"]);
  });

  it("clear empties the cart", () => {
    useCartStore.getState().add(item("o1"));
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });
});

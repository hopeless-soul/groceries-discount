import { describe, expect, it } from "vitest";
import { getShopStatus } from "./shops";
import type { ApiShop } from "./types";

const flyer = { id: "f1", validFrom: "2026-10-14", validTo: "2026-10-20" };
const TODAY = "2026-10-20";

describe("getShopStatus", () => {
  it("is restricted when the shop is missing from the response", () => {
    const shops: ApiShop[] = [{ shop: "lidl", name: "Lidl", flyer }];
    expect(getShopStatus("billa", shops, TODAY)).toBe("restricted");
  });

  it("is outdated when the flyer is null", () => {
    const shops: ApiShop[] = [{ shop: "lidl", name: "Lidl", flyer: null }];
    expect(getShopStatus("lidl", shops, TODAY)).toBe("outdated");
  });

  it("is outdated when validTo is before today", () => {
    const shops: ApiShop[] = [
      { shop: "lidl", name: "Lidl", flyer: { ...flyer, validTo: "2026-10-19" } },
    ];
    expect(getShopStatus("lidl", shops, TODAY)).toBe("outdated");
  });

  it("is available when validTo is today", () => {
    const shops: ApiShop[] = [{ shop: "lidl", name: "Lidl", flyer }];
    expect(getShopStatus("lidl", shops, TODAY)).toBe("available");
  });

  it("is available when validTo is in the future", () => {
    const shops: ApiShop[] = [
      { shop: "lidl", name: "Lidl", flyer: { ...flyer, validTo: "2026-10-30" } },
    ];
    expect(getShopStatus("lidl", shops, TODAY)).toBe("available");
  });

  it("ignores shop keys the frontend does not know", () => {
    const shops = [
      { shop: "lidl", name: "Lidl", flyer },
      { shop: "aldi", name: "Aldi", flyer },
    ] as unknown as ApiShop[];
    expect(getShopStatus("lidl", shops, TODAY)).toBe("available");
    expect(getShopStatus("kaufland", shops, TODAY)).toBe("restricted");
  });
});

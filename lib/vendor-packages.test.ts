import { describe, expect, it } from "vitest";
import { LidlPlus, LidlAPIError } from "lidl-discounts";
import { lookupDiscounts, NoStoreFoundError } from "kaufland-discounts";

describe("vendor package wiring", () => {
  it("lidl-discounts exports a working LidlPlus constructor", () => {
    const client = new LidlPlus({ country: "SK" });
    expect(client.country).toBe("SK");
    expect(LidlAPIError).toBeInstanceOf(Function);
  });

  it("kaufland-discounts exports lookupDiscounts and its error classes", () => {
    expect(lookupDiscounts).toBeInstanceOf(Function);
    expect(NoStoreFoundError).toBeInstanceOf(Function);
  });
});

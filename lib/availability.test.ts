import { describe, expect, it } from "vitest";
import { isOfferAvailable } from "./availability";

const NOW = new Date(2026, 8, 24, 12, 0, 0); // 2026-09-24, local noon

describe("isOfferAvailable", () => {
  it("is available once the start date has passed or is today", () => {
    expect(isOfferAvailable({ validFrom: "2026-09-20" }, NOW)).toBe(true);
    expect(isOfferAvailable({ validFrom: "2026-09-24" }, NOW)).toBe(true);
  });

  it("is not available before the start date", () => {
    expect(isOfferAvailable({ validFrom: "2026-09-25" }, NOW)).toBe(false);
  });
});

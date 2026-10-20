import { describe, expect, it } from "vitest";
import { croppedImageConfig } from "./config/image";
import { computeDisplayDiscount, cropStyle, toDisplayOffer } from "./display";
import type { ApiOffer } from "./types";

const offer: ApiOffer = {
  id: "o1",
  pageId: "p1",
  flyerId: "f1",
  shop: "lidl",
  title: "Coffee",
  category: ["beverages"],
  basePrice: 10,
  discountedPrice: 7,
  loyaltyPrice: null,
  loyaltyDiscount: null,
  discount: 30,
  validFrom: "2026-10-10",
  validTo: "2026-10-20",
  imageUrl: "https://api.example.com/pages/p1/image",
  isCropped: true,
  boundaryBox: [[0, 0], [1, 1]],
};

describe("computeDisplayDiscount", () => {
  it("uses the discounted price when there is no loyalty price", () => {
    expect(computeDisplayDiscount(offer)).toBe(30);
  });

  it("uses the loyalty price as the reference when present", () => {
    expect(computeDisplayDiscount({ ...offer, loyaltyPrice: 6 })).toBe(40);
  });

  it("is null when basePrice is null", () => {
    expect(computeDisplayDiscount({ ...offer, basePrice: null })).toBeNull();
  });

  it("is null when there is no reference price", () => {
    expect(computeDisplayDiscount({ ...offer, discountedPrice: null, loyaltyPrice: null })).toBeNull();
  });

  it("is null when basePrice is 0 or less", () => {
    expect(computeDisplayDiscount({ ...offer, basePrice: 0 })).toBeNull();
    expect(computeDisplayDiscount({ ...offer, basePrice: -1 })).toBeNull();
  });
});

describe("toDisplayOffer", () => {
  it("keeps the title and sets the stub subtitle", () => {
    const display = toDisplayOffer(offer);
    expect(display.displayTitle).toBe("Coffee");
    expect(display.subtitle).toBe("lorem ipsum");
  });

  it("counts the whole validTo day as left", () => {
    // Noon on the last valid day: 0 full days left after today, and the day itself still counts.
    const noon = new Date(2026, 9, 20, 12, 0, 0);
    expect(toDisplayOffer(offer, noon).daysLeft).toBe(1);
  });

  it("reports 0 days left after validTo", () => {
    const nextDay = new Date(2026, 9, 21, 12, 0, 0);
    expect(toDisplayOffer(offer, nextDay).daysLeft).toBe(0);
  });

  it("computes ringPercent from validFrom to the end of validTo", () => {
    // Offer runs from 2026-10-10 00:00 to 2026-10-20 23:59:59; check the midpoint is near 50%.
    const midpoint = new Date(2026, 9, 15, 12, 0, 0);
    const ring = toDisplayOffer(offer, midpoint).ringPercent;
    expect(ring).toBeGreaterThanOrEqual(49);
    expect(ring).toBeLessThanOrEqual(51);
  });

  it("recomputes values for each call", () => {
    const early = toDisplayOffer(offer, new Date(2026, 9, 11, 12));
    const late = toDisplayOffer(offer, new Date(2026, 9, 19, 12));
    expect(late.daysLeft).toBeLessThan(early.daysLeft);
    expect(late.ringPercent).toBeGreaterThan(early.ringPercent);
  });
});

describe("cropStyle", () => {
  it("shows the whole image for a full-page box when clampValues is on", () => {
    Object.assign(croppedImageConfig, { clampValues: true });
    const style = cropStyle([[0, 0], [1, 1]]);
    Object.assign(croppedImageConfig, { clampValues: false });
    expect(style).toMatchObject({
      backgroundSize: "100% 100%",
      backgroundPosition: "0% 0%",
    });
  });

  // Box [[0.1,0.2],[0.4,0.5]] padded by 0.05 is [[0.05,0.15],[0.45,0.55]]: w = 0.4, h = 0.4.
  it("scales the background to the padded box size", () => {
    const [bw, bh] = String(cropStyle([[0.1, 0.2], [0.4, 0.5]]).backgroundSize).split(" ").map(parseFloat);
    expect(bw).toBeCloseTo(250);
    expect(bh).toBeCloseTo(250);
  });

  it("positions the padded box so its left and top edges line up with the container", () => {
    // Padded box starts at 0.05 / 0.15 with size 0.4: the offset is start / (1 - size) of the slack.
    const [px, py] = String(cropStyle([[0.1, 0.2], [0.4, 0.5]]).backgroundPosition).split(" ").map(parseFloat);
    expect(px).toBeCloseTo((0.05 / 0.6) * 100);
    expect(py).toBeCloseTo((0.15 / 0.6) * 100);
  });

  it("clamps the padded box to the page when clampValues is on", () => {
    // [[0.02,0.98],[0.03,1]] pads to [[0,0.93],[0.08,1]]: w = 0.08, h = 0.07, pinned to the left/bottom edges.
    Object.assign(croppedImageConfig, { clampValues: true });
    const style = cropStyle([[0.02, 0.98], [0.03, 1]]);
    Object.assign(croppedImageConfig, { clampValues: false });
    const [bw, bh] = String(style.backgroundSize).split(" ").map(parseFloat);
    const [px, py] = String(style.backgroundPosition).split(" ").map(parseFloat);
    expect(bw).toBeCloseTo(100 / 0.08);
    expect(bh).toBeCloseTo(100 / 0.07);
    expect(px).toBeCloseTo(0);
    expect(py).toBeCloseTo(100);
  });

  it("falls back to the full image for an inverted box", () => {
    expect(cropStyle([[0.6, 0.6], [0.3, 0.3]])).toEqual({ backgroundSize: "100% 100%" });
  });
});

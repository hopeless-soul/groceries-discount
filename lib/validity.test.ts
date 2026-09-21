import { describe, expect, it } from "vitest";
import { computeDaysLeft, computeRingPercent, getUrgencyColor } from "./validity";

const NOW = new Date("2026-09-18T12:00:00.000Z");

describe("computeDaysLeft", () => {
  it("rounds up partial days remaining", () => {
    expect(computeDaysLeft("2026-09-22T00:00:00.000Z", NOW)).toBe(4);
  });

  it("clamps to 0 when validUntil is in the past", () => {
    expect(computeDaysLeft("2026-09-10T00:00:00.000Z", NOW)).toBe(0);
  });
});

describe("computeRingPercent", () => {
  const validFrom = "2026-09-15T00:00:00.000Z";
  const validUntil = "2026-09-22T00:00:00.000Z";

  it("returns 50 when now is halfway through the window", () => {
    expect(computeRingPercent(validFrom, validUntil, NOW)).toBe(50);
  });

  it("clamps to 0 when now is before validFrom", () => {
    expect(
      computeRingPercent(validFrom, validUntil, new Date("2026-09-01T00:00:00.000Z")),
    ).toBe(0);
  });

  it("clamps to 100 when now is after validUntil", () => {
    expect(
      computeRingPercent(validFrom, validUntil, new Date("2026-10-01T00:00:00.000Z")),
    ).toBe(100);
  });

  it("returns 100 for a zero-or-negative-length window", () => {
    expect(computeRingPercent(validUntil, validFrom, NOW)).toBe(100);
  });
});

describe("getUrgencyColor", () => {
  it("returns red at 1 day or fewer left", () => {
    expect(getUrgencyColor(1)).toBe("#dc2626");
    expect(getUrgencyColor(0)).toBe("#dc2626");
  });

  it("returns amber at 2-3 days left", () => {
    expect(getUrgencyColor(2)).toBe("#d97706");
    expect(getUrgencyColor(3)).toBe("#d97706");
  });

  it("returns dark for more than 3 days left", () => {
    expect(getUrgencyColor(4)).toBe("#18181b");
  });
});

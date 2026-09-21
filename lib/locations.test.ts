import { describe, expect, it } from "vitest";
import { COUNTRIES, getCitiesForCountry } from "./locations";

describe("COUNTRIES", () => {
  it("seeds exactly Slovakia today", () => {
    expect(COUNTRIES).toHaveLength(1);
    expect(COUNTRIES[0]).toMatchObject({ name: "Slovakia", code: "SK" });
    expect(COUNTRIES[0].cities.length).toBeGreaterThan(0);
  });
});

describe("getCitiesForCountry", () => {
  it("returns the seeded cities for a known code", () => {
    expect(getCitiesForCountry("SK")).toEqual(COUNTRIES[0].cities);
  });

  it("returns an empty array for an unknown code", () => {
    expect(getCitiesForCountry("XX")).toEqual([]);
  });
});

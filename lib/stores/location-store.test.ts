import { beforeEach, describe, expect, it } from "vitest";
import { buildCacheKey, cachedFetch } from "@/lib/cache/fetchCache";
import { useLocationStore } from "./location-store";

beforeEach(() => {
  localStorage.clear();
  useLocationStore.setState({ country: null, city: null });
});

describe("useLocationStore", () => {
  it("defaults to no country/city", () => {
    expect(useLocationStore.getState()).toMatchObject({ country: null, city: null });
  });

  it("setLocation persists country and city", () => {
    useLocationStore.getState().setLocation("SK", "Bratislava");
    expect(useLocationStore.getState()).toMatchObject({ country: "SK", city: "Bratislava" });

    const stored = JSON.parse(localStorage.getItem("groceries-discount:location") ?? "{}");
    expect(stored.state).toMatchObject({ country: "SK", city: "Bratislava" });
  });

  it("clear resets to null", () => {
    useLocationStore.getState().setLocation("SK", "Bratislava");
    useLocationStore.getState().clear();
    expect(useLocationStore.getState()).toMatchObject({ country: null, city: null });
  });

  it("setLocation clears the fetch cache when country or city changes", async () => {
    useLocationStore.getState().setLocation("SK", "Bratislava");
    const key = buildCacheKey("dashboard", "lidl", "SK", "Bratislava");
    await cachedFetch(key, async () => "cached-value");
    expect(localStorage.getItem("groceries-discount:cache:v2:" + key)).not.toBeNull();

    useLocationStore.getState().setLocation("CZ", "Prague");

    expect(localStorage.getItem("groceries-discount:cache:v2:" + key)).toBeNull();
  });

  it("setLocation does not clear the fetch cache when country/city are unchanged", async () => {
    useLocationStore.getState().setLocation("SK", "Bratislava");
    const key = buildCacheKey("dashboard", "lidl", "SK", "Bratislava");
    await cachedFetch(key, async () => "cached-value");

    useLocationStore.getState().setLocation("SK", "Bratislava");

    expect(localStorage.getItem("groceries-discount:cache:v2:" + key)).not.toBeNull();
  });
});

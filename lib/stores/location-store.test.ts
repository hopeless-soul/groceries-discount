import { beforeEach, describe, expect, it } from "vitest";
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
});

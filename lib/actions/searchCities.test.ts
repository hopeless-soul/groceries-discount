import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchCities } from "./searchCities";

const originalFetch = global.fetch;
const originalApiKey = process.env.GEOAPIFY_API_KEY;

beforeEach(() => {
  process.env.GEOAPIFY_API_KEY = "test-key";
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalApiKey === undefined) {
    delete process.env.GEOAPIFY_API_KEY;
  } else {
    process.env.GEOAPIFY_API_KEY = originalApiKey;
  }
  vi.restoreAllMocks();
});

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("searchCities", () => {
  it("returns [] without calling fetch when the query is shorter than 2 characters", async () => {
    global.fetch = vi.fn();
    const result = await searchCities("A", "SK");
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns [] without calling fetch when GEOAPIFY_API_KEY is missing", async () => {
    delete process.env.GEOAPIFY_API_KEY;
    global.fetch = vi.fn();
    const result = await searchCities("Trenc", "SK");
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("maps and dedupes city names from a successful response", async () => {
    mockFetchOnce({
      features: [
        { properties: { city: "Trencin" } },
        { properties: { city: "Trencin" } },
        { properties: { city: "Trencianske Teplice" } },
        { properties: {} },
      ],
    });

    const result = await searchCities("Trenc", "SK");

    expect(result).toEqual(["Trencin", "Trencianske Teplice"]);
  });

  it("calls Geoapify with the query, country filter, and api key", async () => {
    mockFetchOnce({ features: [] });

    await searchCities("Trenc", "SK");

    const calledUrl = (global.fetch as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain("https://api.geoapify.com/v1/geocode/autocomplete");
    expect(calledUrl).toContain("text=Trenc");
    expect(calledUrl).toContain("type=city");
    expect(calledUrl).toContain("filter=countrycode:SK");
    expect(calledUrl).toContain("apiKey=test-key");
  });

  it("returns [] when the response is not ok", async () => {
    mockFetchOnce({ features: [{ properties: { city: "Trencin" } }] }, false);
    const result = await searchCities("Trenc", "SK");
    expect(result).toEqual([]);
  });

  it("returns [] when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    const result = await searchCities("Trenc", "SK");
    expect(result).toEqual([]);
  });
});

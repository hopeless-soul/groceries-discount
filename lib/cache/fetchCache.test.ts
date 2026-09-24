import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCacheKey, cachedFetch, clearFetchCache, invalidateFetchCache } from "./fetchCache";

beforeEach(() => {
  clearFetchCache();
  localStorage.clear();
});

describe("buildCacheKey", () => {
  it("joins parts with a colon", () => {
    expect(buildCacheKey("dashboard", "lidl", "SK", "Bratislava")).toBe("dashboard:lidl:SK:Bratislava");
  });
});

describe("cachedFetch", () => {
  it("invokes the fetcher and returns its result on a cache miss", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    const result = await cachedFetch("k1", fetcher);

    expect(result).toEqual({ value: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns the cached value without calling the fetcher again within the TTL", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });

    await cachedFetch("k2", fetcher);
    const second = await cachedFetch("k2", fetcher);

    expect(second).toEqual({ value: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("calls the fetcher again once the TTL has elapsed", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ value: 1 }).mockResolvedValueOnce({ value: 2 });

    await cachedFetch("k3", fetcher, { ttlMs: 10 });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = await cachedFetch("k3", fetcher, { ttlMs: 10 });

    expect(second).toEqual({ value: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent calls for the same key into a single fetcher invocation", async () => {
    let resolveFetch: (value: { value: number }) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<{ value: number }>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const first = cachedFetch("k4", fetcher);
    const second = cachedFetch("k4", fetcher);
    resolveFetch!({ value: 42 });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toEqual({ value: 42 });
    expect(secondResult).toEqual({ value: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("persists the resolved value to localStorage under the cache prefix", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 7 });
    await cachedFetch("k5", fetcher);

    const raw = localStorage.getItem("groceries-discount:cache:v3:k5");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toMatchObject({ data: { value: 7 } });
  });

  it("rehydrates from localStorage when the in-memory cache is empty", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 9 });
    await cachedFetch("k6", fetcher);

    // Simulate a fresh page load: memory cache is gone, localStorage persists.
    vi.resetModules();
    const fresh = await import("./fetchCache");

    const result = await fresh.cachedFetch("k6", fetcher);

    expect(result).toEqual({ value: 9 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("invalidateFetchCache", () => {
  it("forces the next call to hit the fetcher and clears the stored entry", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ value: 1 }).mockResolvedValueOnce({ value: 2 });

    await cachedFetch("k7", fetcher);
    invalidateFetchCache("k7");

    expect(localStorage.getItem("groceries-discount:cache:v3:k7")).toBeNull();

    const result = await cachedFetch("k7", fetcher);

    expect(result).toEqual({ value: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

"use client";

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

interface CachedFetchOptions {
  ttlMs?: number;
}

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;
/**
 * Bump the version segment whenever `DashboardData`'s shape changes (e.g. a
 * new offer field). Entries cached under a stale prefix are simply never
 * read again — they age out of localStorage naturally under their own TTL —
 * rather than being served for up to DEFAULT_TTL_MS with the old shape.
 */
const STORAGE_PREFIX = "groceries-discount:cache:v2:";

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

function getStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function readFromStorage<T>(key: string): CacheEntry<T> | null {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(STORAGE_PREFIX + key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (typeof parsed.cachedAt !== "number") throw new Error("invalid entry");
    return parsed;
  } catch {
    storage.removeItem(STORAGE_PREFIX + key);
    return null;
  }
}

function writeToStorage<T>(key: string, entry: CacheEntry<T>): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage unavailable (private browsing, quota exceeded, etc.) - memory cache still works.
  }
}

export function buildCacheKey(...parts: (string | number)[]): string {
  return parts.join(":");
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CachedFetchOptions = {},
): Promise<T> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;

  let entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    const stored = readFromStorage<T>(key);
    if (stored) {
      entry = stored;
      memoryCache.set(key, entry);
    }
  }

  if (entry && Date.now() - entry.cachedAt < ttlMs) {
    return entry.data;
  }

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = fetcher()
    .then((data) => {
      const newEntry: CacheEntry<T> = { data, cachedAt: Date.now() };
      memoryCache.set(key, newEntry);
      writeToStorage(key, newEntry);
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export function invalidateFetchCache(key: string): void {
  memoryCache.delete(key);
  inFlight.delete(key);
  getStorage()?.removeItem(STORAGE_PREFIX + key);
}

export function clearFetchCache(): void {
  memoryCache.clear();
  inFlight.clear();

  const storage = getStorage();
  if (!storage) return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
}

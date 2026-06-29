interface CacheEntry<T> {
  expiresAt: number;
  value?: T;
  promise?: Promise<T>;
}

const cache = new Map<string, CacheEntry<unknown>>();
const MAX_ITEMS = 800;
let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < 60_000 && cache.size < MAX_ITEMS) return;
  lastSweep = now;
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  if (cache.size <= MAX_ITEMS) return;
  for (const key of cache.keys()) {
    cache.delete(key);
    if (cache.size <= MAX_ITEMS) break;
  }
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  sweep(now);

  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    if (hit.value !== undefined) return hit.value;
    if (hit.promise) return hit.promise;
  }

  const promise = loader();
  cache.set(key, { expiresAt: now + ttlMs, promise });
  try {
    const value = await promise;
    cache.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  } catch (error) {
    cache.delete(key);
    throw error;
  }
}

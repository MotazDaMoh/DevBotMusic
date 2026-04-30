import { LRUCache } from 'lru-cache';

/**
 * Per-user, per-command rate limiter with a 7-second TTL (matches v0 behavior).
 * Returns remaining cooldown in whole seconds, or `0` if the command was
 * allowed to proceed.
 */
const cache = new LRUCache<string, boolean>({
  max: 10_000,
  ttl: 7 * 1000,
});

export function applyCooldown(userId: string, commandName: string): number {
  const key = `${userId}:${commandName}`;
  if (cache.has(key)) {
    return Math.ceil((cache.getRemainingTTL(key) ?? 0) / 1000);
  }
  cache.set(key, true);
  return 0;
}

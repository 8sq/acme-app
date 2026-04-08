import type { KVNamespace } from "@cloudflare/workers-types";
import type { CacheStore } from "./types";

export function createCloudflareCache(kv: KVNamespace): CacheStore {
  return {
    async get(key) {
      return kv.get(key);
    },
    async set(key, value, ttl) {
      await kv.put(key, value, ttl ? { expirationTtl: ttl } : undefined);
    },
    async delete(key) {
      await kv.delete(key);
    },
  };
}

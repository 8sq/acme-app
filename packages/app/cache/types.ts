export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Cache extends CacheStore {
  getJson<Value>(key: string): Promise<Value | null>;
  setJson(key: string, value: unknown, ttl?: number): Promise<void>;
}

export function createCache(store: CacheStore): Cache {
  return {
    ...store,
    async getJson<Value>(key: string): Promise<Value | null> {
      const raw = await store.get(key);
      if (raw === null) return null;

      // Trust boundary: callers own the type via the generic parameter.
      // Runtime validation belongs at API edges (Zod etc.), not here.
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      return JSON.parse(raw) as Value;
    },
    async setJson(key, value, ttl) {
      return store.set(key, JSON.stringify(value), ttl);
    },
  };
}

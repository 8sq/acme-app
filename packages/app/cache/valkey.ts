import type IovalkeyModule from "iovalkey";
import type { Cache } from "./types";

export async function createValkeyCache(url: string): Promise<Cache> {
  // Variable + `@vite-ignore` keeps the bundler from statically following
  // this import. Iovalkey must NOT end up in the Cloudflare bundle — it
  // pulls in a CJS interop shim (`createRequire(import.meta.url)`) that
  // crashes workerd at module init. The workerd path never reaches this
  // resolver branch, so the runtime import is never evaluated there.
  const moduleId = "iovalkey";
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const { default: Valkey } = (await import(/* @vite-ignore */ moduleId)) as {
    default: typeof IovalkeyModule;
  };
  const client = new Valkey(url);

  return {
    async get(key) {
      return client.get(key);
    },
    async set(key, value, ttl) {
      if (ttl) await client.set(key, value, "EX", ttl);
      else await client.set(key, value);
    },
    async delete(key) {
      await client.del(key);
    },
  };
}

import { createMiddleware } from "hono/factory";
import { createMediaRoute as createMediaRouteImpl } from "./route";
import { createResolvers } from "./resolve";
import { createPresignUrl, verifyHmacToken } from "./signing";
import type { BucketMap, Storage, StorageEnvVars } from "./types";
import { createUrlUtils } from "./url";

export function createStorageKit<
  TEnv extends StorageEnvVars,
  const TConfig extends BucketMap<TEnv>,
>(config: TConfig) {
  type BucketName = keyof TConfig & string;
  type Buckets = Record<BucketName, Storage>;

  const bucketConfig = config as Readonly<TConfig>;

  const url = createUrlUtils(bucketConfig);
  const { resolveStorage } = createResolvers(bucketConfig);
  const presignUrl = createPresignUrl(bucketConfig, url);

  let cachedStorage: Promise<Buckets> | null = null;
  const storageMiddleware = createMiddleware<{
    Bindings: TEnv;
    Variables: { storage: Buckets };
  }>(async (context, next) => {
    cachedStorage ??= resolveStorage(context.env);
    try {
      context.set("storage", await cachedStorage);
    } catch (error) {
      cachedStorage = null;
      throw error;
    }

    await next();
  });

  function createMediaRoute() {
    return createMediaRouteImpl(
      bucketConfig as unknown as BucketMap,
      storageMiddleware,
      url.isProxyDisabled as (bucket: string, env: StorageEnvVars) => boolean,
      verifyHmacToken,
    );
  }

  return {
    bucketConfig,
    resolveStorage,
    storageMiddleware,
    createMediaRoute,
    presignUrl,
    verifyHmacToken,
    ...url,
  };
}

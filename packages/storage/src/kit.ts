import { createMiddleware } from "hono/factory";
import { createMediaRoute as createMediaRouteImpl } from "./route";
import { createResolvers } from "./resolve";
import { createPresignUrl, verifyHmacToken } from "./signing";
import type { BucketMap, Storage, StorageEnvVars } from "./types";
import { createUrlUtils } from "./url";

interface StorageKitConfig<
  TEnv extends StorageEnvVars,
  TBuckets extends BucketMap<TEnv>,
> {
  buckets: TBuckets;
}

export function createStorageKit<
  TEnv extends StorageEnvVars,
  const TBuckets extends BucketMap<TEnv>,
>({ buckets }: StorageKitConfig<TEnv, TBuckets>) {
  type BucketName = keyof TBuckets & string;
  type Buckets = Record<BucketName, Storage>;

  const bucketConfig = buckets as Readonly<TBuckets>;

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

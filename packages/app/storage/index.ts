import type { R2Bucket } from "@cloudflare/workers-types";
import { getRuntimeKey } from "hono/adapter";
import { createMiddleware } from "hono/factory";
import { createStorage } from "unstorage";
import type { AppEnv } from "../db/types";
import type { BucketName } from "./buckets";
import type { Buckets, Storage } from "./types";

export type { Buckets };

/**
 * Reads `STORAGE_<BUCKET>_PUBLIC_URL` from the Cloudflare bindings or
 * `process.env`. The Record literal is exhaustive over `BucketName` so
 * adding a new public bucket is a compile-time push to extend it.
 */
function readPublicUrlEnv(
  bucket: BucketName,
  env: AppEnv["Bindings"],
): string | undefined {
  const urls: Record<BucketName, string | undefined> = {
    assets:
      env.STORAGE_ASSETS_PUBLIC_URL ?? process.env.STORAGE_ASSETS_PUBLIC_URL,
    uploads: undefined, // private bucket — no public URL by definition
  };
  return urls[bucket];
}

/**
 * True iff the bucket is public AND has a configured direct URL. The proxy
 * GET handler uses this to hard-disable itself when a canonical direct URL
 * exists — there must never be two ways to read a public file.
 */
export function hasDirectPublicUrl(
  bucket: BucketName,
  env: AppEnv["Bindings"],
): boolean {
  return readPublicUrlEnv(bucket, env) !== undefined;
}

/**
 * Returns the URL the client should use for a given file. Public bucket
 * with `STORAGE_<BUCKET>_PUBLIC_URL` set → direct R2/S3 URL. Otherwise →
 * the backend proxy path (the dev fallback for public buckets, and the
 * only path for private buckets).
 */
export function urlFor(
  bucket: BucketName,
  env: AppEnv["Bindings"],
  key: string,
): string {
  const base = readPublicUrlEnv(bucket, env);
  if (base) return `${base.replace(/\/$/u, "")}/${key}`;
  return `/api/v1/${bucket}/${key}`;
}

/** Per-bucket R2 binding lookup. Exhaustive over `BucketName`. */
function r2BindingFor(
  bucket: BucketName,
  env: AppEnv["Bindings"],
): R2Bucket | undefined {
  const bindings: Record<BucketName, R2Bucket | undefined> = {
    assets: env.STORAGE_ASSETS,
    uploads: env.STORAGE_UPLOADS,
  };
  return bindings[bucket];
}

/** Per-bucket S3 bucket name. Exhaustive over `BucketName`. */
function s3BucketNameFor(bucket: BucketName): string {
  const bucketNames: Record<BucketName, string> = {
    assets: process.env.S3_BUCKET_ASSETS ?? "acme-assets",
    uploads: process.env.S3_BUCKET_UPLOADS ?? "acme-uploads",
  };
  return bucketNames[bucket];
}

async function resolveBucket(
  bucket: BucketName,
  env: AppEnv["Bindings"],
): Promise<Storage> {
  // On Cloudflare Workers/Pages, use the per-bucket R2 binding.
  if (getRuntimeKey() === "workerd") {
    const binding = r2BindingFor(bucket, env);
    if (!binding) {
      throw new Error(
        `Please add an R2 binding named 'STORAGE_${bucket.toUpperCase()}'`,
      );
    }
    const { default: r2Driver } =
      await import("unstorage/drivers/cloudflare-r2-binding");
    return createStorage({ driver: r2Driver({ binding }) });
  }

  // On Node.js with S3-compatible config, use one S3 bucket per logical bucket.
  if (process.env.S3_ENDPOINT) {
    const { default: s3Driver } = await import("unstorage/drivers/s3");
    return createStorage({
      driver: s3Driver({
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION ?? "auto",
        bucket: s3BucketNameFor(bucket),
      }),
    });
  }

  // Fall back to a per-bucket subdirectory on the local filesystem.
  const { default: fsDriver } = await import("unstorage/drivers/fs");
  return createStorage({
    driver: fsDriver({
      base: `${process.env.STORAGE_DIR ?? "./data/storage"}/${bucket}`,
    }),
  });
}

export async function resolveStorage(
  env: AppEnv["Bindings"],
): Promise<Buckets> {
  // Building this object literally (rather than reducing over BUCKETS) keeps
  // the result type narrow without any cast — the compiler verifies every
  // BucketName key is present. Adding a bucket is a compile-time push.
  const [assets, uploads] = await Promise.all([
    resolveBucket("assets", env),
    resolveBucket("uploads", env),
  ]);
  return { assets, uploads };
}

let cachedStorage: Buckets | null = null;
export const storageMiddleware = createMiddleware<AppEnv>(
  async (context, next) => {
    cachedStorage ??= await resolveStorage(context.env);
    context.set("storage", cachedStorage);
    await next();
  },
);

/**
 * Single source of truth for the storage buckets the app supports.
 *
 * Each bucket gets its own physical backing — a separate R2 bucket on
 * Cloudflare, a separate S3 bucket on Docker, and a separate filesystem
 * subdirectory locally — so per-bucket access policies, lifecycle rules,
 * and CORS configurations can be set at the infrastructure level.
 *
 * Adding a new bucket:
 *   1. Append it to `BUCKETS` below.
 *   2. Add a matching `STORAGE_<NAME>` binding (and, if public, a
 *      `STORAGE_<NAME>_PUBLIC_URL`) to `CfBindings` and `wrangler.json`.
 *   3. Add new keys to the per-bucket `Record<BucketName, …>` lookups in
 *      `storage/index.ts` — TypeScript will fail compilation until you do.
 *   4. Mount a route file for it in `api/v1/index.ts`.
 */
export const BUCKETS = {
  /** Publicly readable content — product images, avatars, post images, … */
  public: { public: true },
  /** Private user content — message attachments, admin documents, … */
  private: { public: false },
} as const;

export type BucketName = keyof typeof BUCKETS;

/**
 * Typed `Object.keys` — sound for `as const` object literals because the
 * literal's key set is statically known to TypeScript even though the
 * standard library types `Object.keys` as `string[]`.
 */
function typedKeys<TObject extends object>(obj: TObject): (keyof TObject)[] {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  return Object.keys(obj) as (keyof TObject)[];
}

export const BUCKET_NAMES = typedKeys(BUCKETS);

export const PUBLIC_BUCKETS: readonly BucketName[] = BUCKET_NAMES.filter(
  (name) => BUCKETS[name].public,
);

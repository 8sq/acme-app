import { sentryHonoErrorHandler } from "@acme/sentry/api";
import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../db/types";
import { hasDirectPublicUrl, storageMiddleware } from "../storage";
import { BUCKETS, type BucketName } from "../storage/buckets";
import { type FileMeta, metaKey } from "./_helpers";

function buildGetHandler(bucket: BucketName) {
  return async (context: Context<AppEnv, "/:key">) => {
    if (hasDirectPublicUrl(bucket, context.env)) {
      throw new HTTPException(404, {
        message: "this bucket is served from a direct public URL",
      });
    }

    const key = context.req.param("key");
    const storage = context.var.storage[bucket];
    const data = await storage.getItemRaw<Uint8Array>(key);
    if (!data) throw new HTTPException(404, { message: "file not found" });

    const meta = await storage.getItem<FileMeta>(metaKey(key));
    const headers = new Headers({
      "Content-Type": meta?.contentType ?? "application/octet-stream",
      "Content-Length": String(data.byteLength),
    });
    if (BUCKETS[bucket].public) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }
    return new Response(new Uint8Array(data), { status: 200, headers });
  };
}

export default new Hono<AppEnv>()
  .onError(sentryHonoErrorHandler)
  .basePath("/media")
  .use(storageMiddleware)
  .get("/public/:key", buildGetHandler("public"))
  .get("/private/:key", buildGetHandler("private"));

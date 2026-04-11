import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../../server/types";
import { storageMiddleware, urlFor } from "../../storage";
import { MAX_UPLOAD_BYTES, metaKey } from "../../storage/helpers";

const TEST_KEY = "test-image";

const testUpload = new Hono<AppEnv>();

export default testUpload
  .use(storageMiddleware)
  .get("/", async (context) => {
    const exists = await context.var.storage.public.hasItem(TEST_KEY);
    return context.json({
      exists,
      url: exists ? urlFor("public", context.env, TEST_KEY) : null,
    });
  })
  .post("/", async (context) => {
    const body = await context.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      throw new HTTPException(400, { message: "missing file" });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new HTTPException(413, { message: "file too large" });
    }

    const storage = context.var.storage.public;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await storage.setItemRaw(TEST_KEY, bytes);
    await storage.setItem(metaKey(TEST_KEY), {
      contentType: file.type || "application/octet-stream",
      size: file.size,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    });

    return context.json({ url: urlFor("public", context.env, TEST_KEY) });
  });

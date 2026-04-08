import { captureHandledError } from "@acme/sentry/api";
import { createSelectSchema } from "drizzle-zod";
import { Hono } from "hono";
import { z } from "zod";
import { cacheMiddleware } from "../../cache";
import type { AppEnv } from "../../server/types";
import { dbMiddleware } from "../../db";
import { posts } from "../../db/schema";

const POSTS_CACHE_KEY = "posts:all";
const POSTS_CACHE_TTL = 60;

// `createdAt` is a `mode: "timestamp"` column, so drizzle returns it as a
// `Date` and `createSelectSchema` types it as `z.date()`. JSON round-trips
// turn the Date into an ISO string, which `z.date()` would reject — coerce
// it back when validating cached values.
const postsCacheSchema = z.array(
  createSelectSchema(posts).extend({
    createdAt: z.coerce.date(),
  }),
);

const v1 = new Hono<AppEnv>();

export default v1
  .use(dbMiddleware)
  .use(cacheMiddleware)
  .get("/posts", async (context) => {
    const cache = context.var.cache;
    const cached = await cache.get(POSTS_CACHE_KEY);
    if (cached !== null) {
      // Any failure here (invalid JSON, schema drift) is reported to Sentry
      // and falls through silently to a refresh from the database.
      try {
        const parsed = postsCacheSchema.parse(JSON.parse(cached));
        context.header("X-Cache", "HIT");
        return context.json(parsed);
      } catch (error) {
        captureHandledError(context, error);
      }
    }

    const db = context.var.db;
    const allPosts = await db.select().from(posts);
    await cache.set(POSTS_CACHE_KEY, JSON.stringify(allPosts), POSTS_CACHE_TTL);

    context.header("X-Cache", "MISS");
    return context.json(allPosts);
  })
  .get("/sentry-test", () => {
    throw new Error("Sentry backend test error");
  })
  .post("/posts", async (context) => {
    const body = await context.req.json<{ title: string; content: string }>();
    const db = context.var.db;
    const result = await db
      .insert(posts)
      .values({
        title: body.title,
        content: body.content,
      })
      .returning();
    await context.var.cache.delete(POSTS_CACHE_KEY);
    return context.json(result[0], 201);
  });

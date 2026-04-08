import { createSelectSchema } from "drizzle-zod";
import { Hono } from "hono";
import { z } from "zod";
import { cacheMiddleware } from "../../cache";
import type { AppEnv } from "../../server/types";
import { dbMiddleware } from "../../db";
import { posts } from "../../db/schema";

const POSTS_CACHE_KEY = "posts:all";
const POSTS_CACHE_TTL = 60;

const postsCacheSchema = z.array(createSelectSchema(posts));

const v1 = new Hono<AppEnv>();

export default v1
  .use(dbMiddleware)
  .use(cacheMiddleware)
  .get("/posts", async (context) => {
    const cache = context.var.cache;
    const cached = await cache.get(POSTS_CACHE_KEY);
    if (cached) {
      const parsed = postsCacheSchema.safeParse(JSON.parse(cached));
      if (parsed.success) {
        context.header("X-Cache", "HIT");
        return context.json(parsed.data);
      }
      // Cached value didn't match the current schema — fall through and refresh.
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

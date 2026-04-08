import { Hono } from "hono";
import { cacheMiddleware } from "../../cache";
import type { AppEnv } from "../../db/types";
import { dbMiddleware } from "../../db";
import { posts, type Post } from "../../db/schema";

const POSTS_CACHE_KEY = "posts:all";
const POSTS_CACHE_TTL = 60;

const v1 = new Hono<AppEnv>();

export default v1
  .use(dbMiddleware)
  .use(cacheMiddleware)
  .get("/posts", async (context) => {
    const cache = context.var.cache;
    const cached = await cache.getJson<Post[]>(POSTS_CACHE_KEY);
    if (cached) {
      context.header("X-Cache", "HIT");
      return context.json(cached);
    }

    const db = context.var.db;
    const allPosts = await db.select().from(posts);
    await cache.setJson(POSTS_CACHE_KEY, allPosts, POSTS_CACHE_TTL);

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

import { Hono } from "hono";
import type { AppEnv } from "../../db/types";
import { dbMiddleware } from "../../db";
import { posts } from "../../db/schema";
import { storageMiddleware } from "../../storage";
import privateBucket from "./private";
import publicBucket from "./public";

const v1 = new Hono<AppEnv>();

export default v1
  .use(dbMiddleware)
  .use(storageMiddleware)
  .route("/public", publicBucket)
  .route("/private", privateBucket)
  .get("/posts", async (context) => {
    const db = context.var.db;
    const allPosts = await db.select().from(posts);
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
    return context.json(result[0], 201);
  });

import { createMiddleware } from "hono/factory";
import { resolveDatabase } from "./resolve";
import type { DbBindings, Database } from "./types";

export function createDbMiddleware<TSchema extends Record<string, unknown>>(
  schema: TSchema,
) {
  let dbPromise: Promise<Database<TSchema>> | null = null;

  return createMiddleware<{
    Bindings: DbBindings;
    Variables: { db: Database<TSchema> };
  }>(async (context, next) => {
    dbPromise ??= resolveDatabase(context.env, schema);
    context.set("db", await dbPromise);
    await next();
  });
}

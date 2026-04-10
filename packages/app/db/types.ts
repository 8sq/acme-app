import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type * as schema from "./schema";

export type Database = BaseSQLiteDatabase<
  "sync" | "async",
  unknown,
  typeof schema
>;

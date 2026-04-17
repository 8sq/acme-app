import { createDbKit, type Database as GenericDb } from "@acme/db";
import type { EnvVars } from "../types";
import * as schema from "./schema";

export type Database = GenericDb<typeof schema>;
export const { resolveDatabase, dbMiddleware, seed } = createDbKit({
  schema,
  databaseUrl: (env: EnvVars) => env.DATABASE_URL,
});

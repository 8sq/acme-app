import type { SentryBindings } from "@acme/sentry/server";
import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import type { Cache } from "../cache/types";
import type { Database } from "../db/types";

export interface CfBindings extends SentryBindings {
  DB?: D1Database;
  CACHE?: KVNamespace;
  BASIC_AUTH_CREDENTIALS?: string;
}

export interface AppEnv {
  Bindings: CfBindings;
  Variables: {
    db: Database;
    cache: Cache;
  };
}

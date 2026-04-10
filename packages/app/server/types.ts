import type { SentryBindings } from "@acme/sentry/server";
import type {
  D1Database,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";

export interface CfBindings extends SentryBindings {
  DB?: D1Database;
  CACHE?: KVNamespace;
  STORAGE_PUBLIC?: R2Bucket;
  STORAGE_PUBLIC_URL?: string;
  STORAGE_PRIVATE?: R2Bucket;
  STORAGE_KEY_PREFIX?: string;
  KV_STORAGE?: string;
  BASIC_AUTH_CREDENTIALS?: string;
}

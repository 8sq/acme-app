import type { SentryBindings } from "@acme/sentry/server";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface CfBindings extends SentryBindings {
  DB?: D1Database;
  STORAGE_ASSETS?: R2Bucket;
  STORAGE_ASSETS_PUBLIC_URL?: string;
  STORAGE_UPLOADS?: R2Bucket;
  STORAGE_KEY_PREFIX?: string;
  BASIC_AUTH_CREDENTIALS?: string;
}

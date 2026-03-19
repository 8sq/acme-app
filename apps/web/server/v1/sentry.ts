import * as Sentry from "@sentry/cloudflare";
import type { ErrorHandler } from "hono";
import type { AppEnv } from "../db/types";

export const sentryOnError: ErrorHandler<AppEnv> = (error, context) => {
  const eventId = Sentry.captureException(error);

  return context.json({ error: error.message, sentryEventId: eventId }, 500);
};

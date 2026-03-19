import * as Sentry from "@sentry/cloudflare";
import type { ErrorHandler } from "hono";
import type { AppEnv } from "../db/types";

export const sentryOnError: ErrorHandler<AppEnv> = (error, context) => {
  const eventId = Sentry.captureException(error);

  // Output a generic error message, as to not leak any sensitive information.
  // The event ID can be used to look up the error in Sentry.
  const message = { error: "Internal Server Error", sentryEventId: eventId };
  return context.json(message, 500);
};

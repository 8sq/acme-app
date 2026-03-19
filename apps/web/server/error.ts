import * as Sentry from "@sentry/cloudflare";
import type { NitroErrorHandler } from "nitro/types";

const errorHandler: NitroErrorHandler = (error) => {
  const cause = error.cause ?? error;
  console.error(
    cause instanceof Error ? (cause.stack ?? cause.message) : cause,
  );
  Sentry.captureException(cause);
};

export default errorHandler;

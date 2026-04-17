import * as Sentry from "@sentry/cloudflare";
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

interface SentryHonoErrorHandlerOptions {
  /**
   * User-Agent value whose errors should not be forwarded to Sentry.
   * Exact match. The handler still enriches the scope and returns the
   * normal response — only `captureException` is skipped.
   *
   * Use for a caller whose failures are expected and already handled
   * by the caller (e.g. a CI health probe that retries during deploy
   * warmup).
   */
  ignoreUserAgent?: string;
}

/**
 * Build a Hono error handler that forwards uncaught API errors to Sentry
 * and turns them into JSON 500 responses.
 *
 * - `HTTPException`s pass through unchanged. Ones with `status >= 500`
 *   are reported, the rest aren't (they're expected client-error
 *   responses).
 * - Anything else is captured and returned as `{ error, sentryEventId }`
 *   so the frontend can surface the event ID for support.
 *   `sentryEventId` is `null` when capture was suppressed (caller UA
 *   matched `ignoreUserAgent`) or the Sentry client isn't initialized.
 *
 * The current Sentry scope is enriched with the request IP, URL, and
 * method regardless of whether the error is captured.
 *
 * Wire it into your root Hono app:
 *
 * ```ts
 * import { createSentryHonoErrorHandler } from "@acme/sentry/hono";
 *
 * new Hono().onError(createSentryHonoErrorHandler()).route(...);
 * ```
 *
 * Pass `ignoreUserAgent` to silence capture for a specific probe client
 * while still returning the normal error response:
 *
 * ```ts
 * new Hono().onError(
 *   createSentryHonoErrorHandler({
 *     ignoreUserAgent: "acme-ci-health-probe",
 *   }),
 * );
 * ```
 */
export function createSentryHonoErrorHandler(
  options: SentryHonoErrorHandlerOptions = {},
): ErrorHandler {
  const { ignoreUserAgent } = options;

  return (error, context) => {
    const ip =
      context.req.header("cf-connecting-ip") ??
      context.req.header("x-forwarded-for")?.split(",")[0]?.trim();

    const scope = Sentry.getCurrentScope();
    scope.setUser({ ip_address: ip });
    scope.setExtra("url", context.req.url);
    scope.setExtra("method", context.req.method);

    const userAgent = context.req.header("user-agent");
    const shouldCapture = !ignoreUserAgent || userAgent !== ignoreUserAgent;

    if (error instanceof HTTPException) {
      if (error.status >= 500 && shouldCapture) {
        Sentry.captureException(error);
      }

      return error.getResponse();
    }

    const eventId = shouldCapture ? Sentry.captureException(error) : null;
    return context.json(
      { error: "Internal Server Error", sentryEventId: eventId ?? null },
      500,
    );
  };
}

export default createSentryHonoErrorHandler;

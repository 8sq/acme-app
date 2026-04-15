import { sentryHonoErrorHandler } from "@acme/sentry/api";
import { Hono } from "hono";
import type { AppEnv } from "../types";
import { createMediaRoute } from "../storage";

const media = new Hono<AppEnv>()
  .onError(sentryHonoErrorHandler)
  .route("/media", createMediaRoute());

export default media;

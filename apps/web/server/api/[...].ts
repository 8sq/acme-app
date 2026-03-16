import { defineEventHandler } from "nitro/h3";
import app from "@ygoma/api";

interface NitroEventContext {
  // Only available in Cloudflare Workers environment
  cloudflare?: {
    env: Record<string, unknown>;
  };
}

export default defineEventHandler((event) => {
  const context = event.context as NitroEventContext;
  const env = context.cloudflare?.env ?? {};
  return app.fetch(event.req, env);
});

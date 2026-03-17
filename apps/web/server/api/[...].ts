import { defineEventHandler } from "nitro/h3";
import app from "@ygoma/api";
import type { NitroEventContext } from "../nitro-context";

export default defineEventHandler((event) => {
  const context = event.context as NitroEventContext;
  const env = context.cloudflare?.env ?? {};
  console.log(
    "Handling request",
    event.req.url,
    "with env",
    env,
    "and context",
    context,
  );
  return app.fetch(event.req, env);
});

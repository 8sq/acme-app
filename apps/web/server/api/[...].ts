import { defineEventHandler } from "nitro/h3";
import app from "@ygoma/api";
import type { NitroEventContext } from "../nitro-context";

export default defineEventHandler((event) => {
  const context = event.context as NitroEventContext;
  const env = context.cloudflare?.env ?? {};
  return app.fetch(event.req, env);
});

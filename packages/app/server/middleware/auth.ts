import { defineEventHandler } from "nitro/h3";
import type { CfBindings } from "../types";

export default defineEventHandler((event) => {
  if (event.url.pathname === "/api/health") {
    return;
  }

  // Media routes handle their own access control: public buckets are
  // open, private buckets use HMAC token verification or S3 presigned
  // URLs. Basic auth should not interfere.
  if (event.url.pathname.startsWith("/media/")) {
    return;
  }

  const cfEnv = event.runtime?.cloudflare?.env as CfBindings | undefined;
  const credentials = (cfEnv ?? process.env).BASIC_AUTH_CREDENTIALS;

  if (!credentials || credentials.trim() === "") {
    return;
  }

  const allowedTokens = credentials.split(";").filter(Boolean);
  const authHeader = event.req.headers.get("authorization") ?? "";
  const match = /^Basic\s+(.+)$/i.exec(authHeader);
  const token = match?.[1] ?? "";

  if (token && allowedTokens.includes(token)) {
    return;
  }

  event.res.status = 401;
  event.res.headers.set("WWW-Authenticate", 'Basic realm="Protected"');

  return "Unauthorized";
});

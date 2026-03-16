import type { H3EventContext } from "nitro/h3";

export interface NitroEventContext extends H3EventContext {
  // Only available in Cloudflare Workers environment
  cloudflare?: {
    env: {
      BASIC_AUTH_CREDENTIALS?: string;
    };
  };
}

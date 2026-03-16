export interface NitroEventContext {
  // Only available in Cloudflare Workers environment
  cloudflare?: {
    env: Record<string, unknown>;
  };
}

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Plugin } from "vite";

const DEBUG_ID_RE = /sentry-dbid-([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})/;

// Rolldown does not propagate the `debugId` field that the Sentry plugin
// injects into source maps via its renderChunk hook. Patch each .map
// file with the debug ID extracted from its companion JS chunk so that
// Sentry can match error stack traces to uploaded maps.
async function patchSourceMapDebugIds(
  dir: string,
  bundle: Record<string, { type: string; code?: string }>,
): Promise<void> {
  const writes: Promise<void>[] = [];

  for (const [filename, chunk] of Object.entries(bundle)) {
    if (chunk.type !== "chunk" || !chunk.code) {
      continue;
    }

    const match = chunk.code.match(DEBUG_ID_RE);
    if (!match) {
      continue;
    }

    const debugId = match[1];
    const mapPath = join(dir, filename + ".map");

    writes.push(
      readFile(mapPath, "utf8")
        .then((raw) => {
          const map = JSON.parse(raw) as Record<string, unknown>;
          if (map.debugId) {
            return;
          }
          map.debugId = debugId;
          return writeFile(mapPath, JSON.stringify(map));
        })
        .catch(() => {
          // Map file may not exist when sourcemaps are disabled.
        }),
    );
  }

  await Promise.all(writes);
}

/**
 * Patches `.map` files with `debugId` before the Sentry plugin uploads
 * them. Required because Rolldown drops the field that the Sentry
 * plugin injects via `renderChunk`.
 *
 * Must use `enforce: "pre"` so its `writeBundle` runs before the Sentry
 * plugin's (which also uses `enforce: "pre"` — same enforcement level
 * runs in registration order, and this plugin is registered first).
 */
export function debugIdsPlugin(): Plugin {
  return {
    name: "@acme/sentry/debug-ids",
    enforce: "pre",
    async writeBundle(options, bundle) {
      if (options.dir) {
        await patchSourceMapDebugIds(options.dir, bundle);
      }
    },
  };
}

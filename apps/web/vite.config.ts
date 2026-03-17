import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({ srcDirectory: "src" }),
    viteReact(),
    nitro({
      serverDir: "./server",
      errorHandler: "./server/error.ts",
      rolldownConfig: {
        // Node-only DB drivers — these need node:http, which breaks in CF.
        external: [/^drizzle-orm\/(libsql|better-sqlite3)$/],
      },
    }),
  ],
});

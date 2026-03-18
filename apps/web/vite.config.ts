import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    sourcemap: "hidden",
  },
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
        // Node-only — these use APIs that break in CF Workers.
        external: [/^drizzle-orm\/libsql$/, /^@sentry\/node/],
      },
    }),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: process.env.VITE_SENTRY_RELEASE,
        dist: process.env.VITE_SENTRY_DIST,
        setCommits: { auto: true },
      },
      sourcemaps: {
        filesToDeleteAfterUpload: ["./dist/**/*.map"],
      },
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});

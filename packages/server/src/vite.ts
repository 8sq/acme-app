import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NitroEventHandler } from "nitro/types";
import { nitro, type NitroPluginConfig } from "nitro/vite";
import type { PluginOption } from "vite";

interface AcmeServerOptions {
  apps?: Record<string, string>;
  nitro?: NitroPluginConfig;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  cloudflareExternals?: string[];
}

function readPackageJson(dir: string): PackageJson | undefined {
  try {
    return JSON.parse(
      readFileSync(resolve(dir, "package.json"), "utf-8"),
    ) as PackageJson;
  } catch {
    return undefined;
  }
}

function collectExternals(root: string): string[] {
  const pkg = readPackageJson(root);
  if (!pkg) {
    return [];
  }

  const ownExternals = pkg.cloudflareExternals ?? [];
  const depsExternals = Object.keys({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  }).flatMap((dep) => {
    const depPkg = readPackageJson(resolve(root, "node_modules", dep));
    return depPkg?.cloudflareExternals ?? [];
  });

  return [...ownExternals, ...depsExternals];
}

function middleware(handler: string): NitroEventHandler {
  return { route: "", handler, middleware: true };
}

export function acmeServer(options: AcmeServerOptions = {}): PluginOption {
  const isCf = process.env.NITRO_PRESET?.startsWith("cloudflare") ?? false;
  const pkg = import.meta.dirname;
  const root = process.cwd();

  const virtual: Record<string, string> = {};
  const handlers: NitroEventHandler[] = [
    middleware(resolve(pkg, "nitro/middleware/env")),
    middleware(resolve(pkg, "nitro/middleware/sentry")),
  ];

  for (const [route, appPath] of Object.entries(options.apps ?? {})) {
    const id = `#acme${route.replaceAll("/", "-")}`;
    virtual[id] = [
      `import { createApiEventHandler } from "@acme/server";`,
      `import app from "${resolve(root, appPath)}";`,
      `export default createApiEventHandler(app);`,
    ].join("\n");
    handlers.push({ route: `${route}/**`, handler: id, lazy: true });
  }

  return nitro({
    serverDir: false,
    errorHandler: resolve(pkg, "nitro/error"),
    virtual: { ...virtual, ...options.nitro?.virtual },
    handlers: [...handlers, ...(options.nitro?.handlers ?? [])],
    rolldownConfig: {
      external: isCf ? collectExternals(root) : [],
      ...options.nitro?.rolldownConfig,
    },
    ...options.nitro,
  });
}

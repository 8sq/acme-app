# ---- Stage 1: Build ----
FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable

# Install dependencies first (cached unless lockfile/manifests change)
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@acme/app

# ---- Stage 2: Production ----
FROM node:24-alpine

WORKDIR /app
RUN corepack enable

# Prepare the data volume
RUN mkdir -p /var/lib/acme
VOLUME /var/lib/acme

# Self-contained nitro server bundle (with its own package.json)
COPY --from=build /app/packages/app/.output .

# Migrations + drizzle config, alongside the server bundle
COPY packages/app/db/migrations server/db/migrations
COPY packages/app/drizzle.config.ts server/drizzle.config.ts

# Reinstall server deps fresh so libsql resolves the correct native
# binding for the build platform via its optionalDependencies. Also
# pull in drizzle-kit (and its peer deps drizzle-orm + @libsql/client,
# both of which nitro inlined into the bundle) for the migrate step.
RUN cd server && pnpm install --prod && pnpm add drizzle-kit drizzle-orm @libsql/client

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:///var/lib/acme/sqlite.db

EXPOSE 3000

WORKDIR /app/server
CMD ["sh", "-c", "pnpm exec drizzle-kit migrate && node index.mjs"]

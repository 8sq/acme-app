# ---- Stage 1: Build ----
FROM oven/bun:1.3.11-alpine AS build

WORKDIR /app

# Install dependencies first (cached unless lockfile changes)
COPY package.json bun.lock bunfig.toml turbo.json ./
COPY packages/app/package.json packages/app/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
RUN bun install --frozen-lockfile

# Then copy source and build
COPY . .
RUN bun turbo build --filter=@acme/app

# ---- Stage 2: Production ----
FROM oven/bun:1.3.11-alpine

WORKDIR /app

# Prepare the data volume
RUN mkdir -p /var/lib/acme
VOLUME /var/lib/acme

# Install production dependencies using the workspace lockfile
COPY --from=build /app/package.json /app/bun.lock /app/bunfig.toml ./
COPY --from=build /app/packages/app/package.json packages/app/package.json
COPY --from=build /app/packages/ui/package.json packages/ui/package.json
COPY --from=build /app/packages/tsconfig/package.json packages/tsconfig/package.json
RUN sed -i '/"prepare"/d' package.json \
 && bun install --frozen-lockfile --production

# Server output
COPY --from=build /app/packages/app/.output packages/app/.output

# Migrations
COPY packages/app/db/migrations packages/app/db/migrations
COPY packages/app/drizzle.config.ts packages/app/drizzle.config.ts

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:///var/lib/acme/sqlite.db

EXPOSE 3000

CMD ["sh", "-c", "cd packages/app && bunx drizzle-kit migrate && bun /app/packages/app/.output/server/index.mjs"]

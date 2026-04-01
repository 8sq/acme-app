# Acme

Full-stack app template: Bun monorepo with TanStack Start, Hono,
Drizzle ORM, and Nitro. Deploys to Cloudflare Pages or Docker.

## Getting Started

```sh
git clone <repo-url> my-project && cd my-project

# ...you probably want to open the project in a dev container at this point...

./init.sh my-project   # replaces @acme/acme placeholders

bun install
bun dev
```

The app runs at `http://localhost:3000` with the API at `/api/*`.

## Dev Container

The devcontainer is recommended for a consistent environment with Bun,
Playwright, and passwordless sudo pre-configured. Open the Project in VS Code
or GitHub Codespaces and it will prompt you to reopen in the container.

To add personal setup (extra tools, shell config, etc.), create
`.devcontainer/user/build.sh` — it runs at image build time and
is gitignored.

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `bun dev`         | Start dev server                     |
| `bun lint`        | Run oxfmt + oxlint + tsc             |
| `bun lint:fix`    | Auto-fix lint issues                 |
| `bun run test`    | Run tests                            |
| `bun test:cov`    | Run tests with coverage              |
| `bun build`       | Production build                     |
| `bun db:generate` | Generate Drizzle migrations          |
| `bun db:migrate`  | Apply migrations locally             |
| `bun db:seed`     | Seed the local database              |
| `bun db:reset`    | Drop and recreate the local database |
| `bun storybook`   | Run Storybook at `localhost:6006`    |

## Deployment

Cloudflare Pages is the primary target. Docker works as an
alternative. See [ARCHITECTURE.md](ARCHITECTURE.md) for deployment
details, CI/CD setup, and required GitHub secrets.

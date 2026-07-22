1. Install dependencies

corepack enable pnpm     # if pnpm isn't already on the machine
pnpm install             # installs for all workspaces (apps/web, apps/api, packages/*) at once

This is a pnpm workspace monorepo — one pnpm install at the root wires up all four packages (apps/web, apps/api, packages/calc-engine, packages/shared-types) and symlinks their cross-references (e.g. apps/web importing @power-distro/calc-engine directly from source, no build step needed for dev).

2. Start Postgres

docker compose up -d postgres

docker-compose.yml at the repo root just defines one service: Postgres 16 on port 5432, credentials distro/distro, db name power_distro. That's the only external dependency — everything else is Node.

3. Set up the schema + seed data

pnpm --filter @power-distro/api exec prisma migrate dev
pnpm --filter @power-distro/api exec prisma db seed

- migrate dev applies the Prisma migration under apps/api/prisma/migrations — creates all the tables (EquipmentSpec, CableSpec, Plot, DistroUnit, Circuit, EquipmentInstance).
- db seed runs apps/api/prisma/seed.ts, which loads a starter catalog of common gear (fixture wattages, cable ampacities) so the app isn't empty on first load. Check apps/api/.env for DATABASE_URL — it should already point at the docker-compose Postgres.

4. Run the two dev servers

pnpm dev:api    # Fastify API on :3001
pnpm dev:web    # Vite dev server on :5173, proxies /api/* -> :3001

Run these in two terminals (or background them). apps/web's Vite config proxies API calls so the browser only ever talks to :5173.

Then open http://localhost:5173 — that's the actual app: an equipment/cable catalog page and a plot builder where you drag equipment onto circuits and get live safety-check feedback.

Running the tests instead

If you just want to confirm the logic works without touching the UI:

pnpm --filter @power-distro/calc-engine test   # the safety-critical calc engine, no DB needed
pnpm --filter @power-distro/api test           # needs Postgres up (step 2) — hits real DB via Prisma
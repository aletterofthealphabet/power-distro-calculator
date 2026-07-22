# Power Distro Calculator

A web app for entertainment/production electricians: log equipment and
cable specs, build a power plot (distros/circuits/equipment), and get
safety checks (breaker/cable/connector/voltage-drop) plus phase-balance
optimization. See `IMPLEMENTATION_PLAN.md` and `DESIGN.md` for the full
domain model, calc engine, and architecture.

## Stack

Node.js + TypeScript monorepo (pnpm workspaces): React + Vite frontend,
Fastify + Prisma backend, Postgres, and a pure-TS `calc-engine` package
shared by both.

## Quick start

```bash
corepack enable pnpm       # if pnpm isn't already available
pnpm install

docker compose up -d postgres      # local Postgres on :5432
pnpm --filter @power-distro/api exec prisma migrate dev
pnpm --filter @power-distro/api exec prisma db seed   # starter equipment/cable catalog

pnpm dev:api    # Fastify on :3001
pnpm dev:web    # Vite on :5173, proxies /api -> :3001
```

Then open http://localhost:5173.

## Testing

```bash
pnpm --filter @power-distro/calc-engine test   # Vitest, the safety-critical checks
```

## Layout

- `packages/calc-engine` — pure TS, zero deps: per-circuit load, the six
  safety checks (continuous derating, cable ampacity, connector rating,
  distro capacity, voltage drop, phase-leg overcurrent), and the greedy
  LPT phase balancer. Imported directly by both `apps/web` (instant
  client-side feedback) and `apps/api` (source of truth on save).
- `packages/shared-types` — DB-shaped entity types used across the API
  boundary.
- `apps/api` — Fastify REST API + Prisma/Postgres. `POST
  /plots/:id/analyze` runs the engine over a saved plot;
  `POST /plots/:id/auto-balance` proposes a rebalance without writing
  anything until confirmed via a normal `PATCH`.
- `apps/web` — React plot builder: drag equipment onto circuits, see
  live violations/phase-balance bars, then check the server-verified
  `/analysis` page and apply/reject an auto-balance proposal.

## Status

Phases 0-4 (scaffolding, calc engine, data layer, API, frontend plot
builder) are implemented and have been exercised end-to-end against a
real Postgres instance. The seeded equipment/cable catalog figures are
flagged `unverified: true` (see `DESIGN.md` §5) — cross-check against
current NEC tables / manufacturer datasheets before relying on them for
a real show. Local-search/ILP rebalancing, auth, and multi-user sharing
are out of scope for now (plan §6 Phases 5-6, §7a.5).

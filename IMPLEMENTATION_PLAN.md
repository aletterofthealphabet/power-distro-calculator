# Power Distro Calculator — Implementation Plan

## 0. Status (re-verified 2026-07-22, pass 2)

Re-read `specs/base.md` and re-scanned the repo for application code
(`package.json`, source dirs, schema/migration files, docker-compose).
Nothing has changed since this plan was first written: `specs/base.md`
is still the single one-line prompt (unchanged, verified by content —
mtime 01:03 vs. this plan's prior pass at 01:13, no edits since), and
the repo still contains zero application code — only `README.md`
(the single committed file, per `git log`/`git show --stat HEAD`) and
Ralph-loop scaffolding (`loop.sh`, `PROMPT_plan.md`, `prompts.txt`,
`reflection.md`, `running.md`). The gap analysis in §1 still holds
verbatim, as does everything below through §9.

**Loop-progress note (new this pass):** this is the second consecutive
`loop.sh -m plan` iteration to conclude "nothing changed, plan already
covers it." Plan-mode iterations cannot make progress past this point
by themselves — the two unblocking actions are (a) a human confirming
or overriding the §7a defaults, and (b) authoring `PROMPT_build.md` so
`loop.sh -m build` (or a manual switch to build mode) can start Phase 0
scaffolding. Until one of those happens, further plan-mode passes will
keep re-verifying the same zero-drift state. Flagging this so the loop
isn't left spinning silently.

Because this is an autonomous planning loop (`loop.sh -m plan`) with no
guarantee a human answers §7's open questions between iterations, the
prior pass converted §7 into explicit **default decisions** (§7a) so
the plan stays actionable and Phase 0 isn't permanently blocked, and
added a draft schema (§8) and API surface (§9) to make Phases 2–3
concrete. Defaults are reversible — flagged clearly and overridable by
the user at any time.

## 1. Gap analysis: spec vs. existing code

`specs/base.md` is not a detailed spec — it is the single raw prompt that
kicked off this project (an entertainment electrician + software engineer
asking for a plan for a power distribution web app). There is no other
spec content to reconcile.

Existing code: **none**. The only committed file is `README.md` (title
only). Uncommitted scaffolding present (`loop.sh`, `PROMPT_plan.md`,
`prompts.txt`, `reflection.md`, `running.md`) is Ralph-loop tooling to run
this planning/build cycle autonomously — not application code. There is no
`package.json`, no source directory, no database, no tests, no chosen
stack. `PROMPT_build.md`, referenced by `loop.sh` in build mode, does not
exist yet either.

**Conclusion:** this is a greenfield project. This document is the first
real spec derived from the one-line prompt; there's nothing in the repo to
diff it against beyond "nothing is built."

---

## 2. Domain summary (from the prompt)

Build a web app for entertainment/production electricians that:
- Stores equipment specs (fixtures, distros, cable) in a database.
- Lets users interactively add/log specs for new equipment (not just a
  static fixture library).
- Lets users build a "power plot": assign equipment to circuits/distros
  for a show or event.
- Calculates whether a proposed setup is **safe** (breaker/panel
  capacity, continuous-load derating, cable ampacity, voltage drop).
- **Balances load across phases** (single-phase edge/neutral balance and
  three-phase L1/L2/L3 balance).
- **Optimizes** the plot — primarily phase balance, factoring in cabling
  (minimize runs/adapters, respect cable ampacity and length limits).

---

## 3. Core domain model

### Entities

- **EquipmentSpec** — a reusable catalog entry a user creates/edits.
  - `name`, `category` (lighting fixture, LED driver, hazer, video wall,
    audio amp, motor, practical, etc.)
  - `power_watts` (nominal draw) and/or `current_amps` + `voltage` +
    `power_factor` (some gear, e.g. motors/switch-mode PSUs, is better
    specified by amps + PF than watts alone)
  - `voltage` (120V, 208V, 230V, 400V…), `phase` (1φ or 3φ)
  - `connector_type` (Edison/NEMA 5-15, stage pin, twist-lock L5-20,
    Socapex 19-pin, camlock, PowerCON TRUE1, IEC C13/C19…)
  - `is_continuous_load` (bool — drives the 80% derating rule)
  - `notes`, `source` (manufacturer datasheet link/user-entered)
  - `created_by`, `created_at`, `updated_at` — user-editable catalog, so
    versioning/audit matters once multiple users share a catalog.

- **Cable/Feeder Spec** — catalog of cable types.
  - `gauge` (AWG), `conductor_count`, `connector_type` (Socapex, camlock,
    stage pin, Edison), `rated_amps` (ampacity, ideally per NEC Table
    310.16 with a lookup rather than hardcoded), `length_options` or
    freeform length, `voltage_drop_per_amp_per_100ft` (or derive from
    resistance table by gauge).

- **DistroUnit** — a physical power distribution box.
  - `name`, `input_connector` (e.g. camlock 400A, 100A Cam, L21-30),
    `max_amps`, `phase_config` (1φ/3φ, voltage), list of **Circuits**.

- **Circuit** — one breaker/output on a distro.
  - `breaker_rating_amps` (e.g. 20A, 50A), `voltage`, `phase_leg`
    assignment (L1/L2/L3 or hot/neutral for split-phase),
    `connector_type`, `is_continuous` override, assigned
    `EquipmentInstance`s.

- **EquipmentInstance** — an EquipmentSpec placed into a specific Plot,
  with a quantity and an assigned circuit/cable run. This is the
  many-to-many join that actually gets power-math applied to it.

- **Plot** (a.k.a. Project/Show) — top-level container: a named event
  with one or more DistroUnits, their circuits, and EquipmentInstances.
  Has `venue`, `date`, `available_power_sources` (e.g. house power specs,
  generator specs), `owner`.

- **User** — for multi-user catalogs and plot ownership (auth can be
  minimal at first — see Phase 5).

### Relationships
`Plot 1—N DistroUnit 1—N Circuit 1—N EquipmentInstance N—1 EquipmentSpec`,
and `EquipmentInstance` optionally references a `CableSpec` for its run
(distro → equipment) with a `length_ft`.

---

## 4. Calculation engine (the core value of the product)

This should be a pure, independently-testable module (no DB/HTTP
dependencies) — critical since it's a safety-relevant calculation.

### 4.1 Basic per-item load
- `amps = watts / voltage` when only watts given (assume PF handled via
  watts already being real power), or `amps` given directly for
  motor/inductive loads.
- Aggregate per circuit: `circuit_load_amps = Σ amps of assigned
  EquipmentInstances × quantity`.

### 4.2 Safety checks (must surface as pass/fail + explanation, not just a number)
- **Continuous load derating (NEC 210.19/210.20 analog):** continuous
  loads (on ≥3 hrs, e.g. most show lighting) must not exceed 80% of
  breaker rating. `circuit_load_amps ≤ 0.8 × breaker_rating_amps` for
  continuous; ≤ 100% if genuinely non-continuous.
- **Cable ampacity:** `circuit_load_amps ≤ cable.rated_amps`, and cable
  rating must be ≥ breaker rating it's feeding (protect the cable, not
  just the load).
- **Connector rating:** connector must be rated ≥ circuit load (e.g.
  don't run 25A continuous through a 20A stage-pin).
- **Distro/panel main capacity:** sum of all circuit loads (accounting
  for diversity if modeled) ≤ distro's main breaker/input rating.
- **Voltage drop:** compute from cable gauge + run length + current;
  flag runs exceeding a configurable threshold (commonly 3% for
  branch circuits, 5% combined feeder+branch — expose as a setting
  rather than hardcoding, since house rules vary).
- **Phase/leg overcurrent:** each phase leg's total current must not
  exceed the source's per-leg rating even if the panel total is fine.

### 4.3 Phase balancing & optimization
- **Balance objective:** minimize max deviation between phase-leg totals
  (for 3φ: minimize `max(L1,L2,L3) - min(L1,L2,L3)`, ideally as % of
  average).
- **Algorithm approach:**
  1. Start simple: greedy bin-packing — sort equipment loads
     descending, assign each to the currently-lightest leg
     (LPT/longest-processing-time heuristic). Fast, deterministic,
     good-enough for most real plots (dozens–low-hundreds of items).
  2. If greedy proves insufficient, offer a "re-optimize" pass using a
     local-search/simulated-annealing or ILP (e.g. via a lightweight
     solver) swap step — pairwise swap items between legs while it
     improves balance, subject to constraints (§4.2) and **hard
     constraints from cabling** (an item can only be assigned to a leg
     reachable by its physical circuit/cable run — you can't
     "rebalance" a fixture onto a phase there's no cable to).
  3. Respect user pins: some items may be manually locked to a specific
     circuit (real-world runs are already cabled); optimizer only moves
     unpinned items.
- **Cabling-aware constraint:** the optimizer operates within the
  circuit/cable topology the user has physically laid out — it
  reassigns *which circuit* an item goes to among already-available
  circuits/legs, it does not invent new cable runs. A separate
  "suggest wiring" feature (stretch goal) could propose which distro
  circuits to use to minimize total cable length/adapter count.

### 4.4 Output
For a given Plot: per-circuit load %, per-leg totals + balance score,
list of violations (safety failures) with severity and human-readable
reason, suggested reassignments, and total system draw vs. source
capacity (e.g. generator headroom).

---

## 5. Tech stack (needs a decision — recommendation below)

Nothing is chosen yet. Recommendation, optimized for a solo/small-team
build with a relational, constraint-heavy domain:

- **Backend:** Node.js + TypeScript, Express or Fastify, Prisma ORM.
  TypeScript end-to-end lets the calculation engine's types (Amps,
  Volts, Watts as branded types) be shared between backend and frontend
  without duplication/drift.
- **Database:** PostgreSQL (relational fits the entity model well;
  numeric precision for electrical values; easy to add
  constraints/checks at the DB level as a second line of defense).
- **Frontend:** React + TypeScript + Vite. A calculator-heavy UI benefits
  from a component library with solid form/table primitives.
- **Calculation engine:** standalone `packages/calc-engine` (pure
  TS, zero deps) so it can be unit-tested exhaustively and reused
  frontend (instant feedback while editing) and backend (source of
  truth / validation on save) identically.
- **Testing:** Vitest for unit tests (esp. the calc engine — this is the
  highest-risk-of-being-wrong code in the app), Playwright for e2e once
  UI exists.

This is a recommendation, not a locked decision — flag to the user for
confirmation before Phase 0 build work starts.

---

## 6. Phased roadmap

**Phase 0 — Project scaffolding**
Initialize chosen stack, monorepo layout (`apps/web`, `apps/api`,
`packages/calc-engine`, `packages/shared-types`), CI lint/test, Postgres
via docker-compose for local dev.

**Phase 1 — Calculation engine (no UI, no DB)**
Implement §4 as pure functions with full unit test coverage: per-item
amps, derating rule, cable ampacity check, voltage drop, phase-leg
aggregation, greedy balancer. This validates the domain logic before
building anything on top of it.

**Phase 2 — Data layer**
Postgres schema + migrations for entities in §3. Seed script with a
starter equipment/cable catalog (common gear: ETC/Chauvet fixture
wattages, standard Socapex/camlock/stage-pin cable ampacities) so the
app isn't empty on first run.

**Phase 3 — Backend API**
REST (or tRPC, given full-TS stack) endpoints: CRUD for EquipmentSpec,
CableSpec, Plot, DistroUnit, Circuit, EquipmentInstance; a
`POST /plots/:id/analyze` endpoint that runs the Phase 1 engine over a
plot and returns §4.4 output.

**Phase 4 — Frontend: catalog & plot builder**
- Equipment catalog CRUD UI ("add and log specs of new equipment").
- Plot builder: add distros/circuits, drag equipment instances onto
  circuits, live client-side calc-engine feedback as you build (no
  round trip needed for instant feedback; server remains source of
  truth on save).

**Phase 5 — Balancing & optimization UI**
Visualize per-leg load bars, one-click "auto-balance" (runs the
optimizer, shows proposed diff, user accepts/rejects/pins), violation
list with inline explanations linking back to the specific check in §4.2.

**Phase 6 — Auth, multi-user, polish**
Basic auth (even single-user-with-login is fine to start), sharing a
Plot/catalog across a team, export (PDF/CSV power plot for load-in day),
audit log for who changed a catalog entry.

**Stretch goals (post-MVP, not part of this plan's scope):**
Wiring/cable-run suggestion engine, generator sizing/fuel-burn
estimates, integration with lighting-console patch exports, mobile-
friendly load-in checklist view.

---

## 7. Open questions / assumptions to confirm with user before Phase 0

1. **Stack confirmation** — is Node/TS/React/Postgres acceptable, or is
   there a preferred stack (e.g. Python backend, given "pro software
   engineer" framing could go either way)?
2. **Regulatory scope** — should safety checks explicitly cite NEC
   article numbers (US-centric), or stay jurisdiction-agnostic with
   configurable thresholds (derating %, voltage-drop %) so it's usable
   outside the US?
3. **Single-user vs. team tool** — does auth/multi-tenancy matter for
   MVP, or is this a personal tool first (defer Phase 6)?
4. **Ampacity/voltage-drop tables** — source these from a maintained
   reference table (NEC Table 310.16 equivalent) rather than
   hand-entering; need to confirm a data source or whether the user
   will supply/verify the table.
5. **Optimizer strength** — is greedy LPT balancing sufficient for
   expected plot sizes, or is a stronger solver needed (affects Phase 5
   effort significantly)?
6. **`PROMPT_build.md`** does not exist yet — needed before `loop.sh -m
   build` can run; should be authored once this plan is approved.

---

## 7a. Default decisions (applied pending user override)

Since this is an unattended planning loop, each open question above is
given a working default below so Phase 0 can start without stalling.
Any of these should be revisited the moment a human weighs in.

1. **Stack** → proceed with Node.js/TypeScript + React + Postgres as
   recommended in §5. Rationale: shared types between the calc engine
   and both frontend/backend outweigh the benefit of a second language,
   and the team framing ("pro software engineer") doesn't signal an
   existing Python/Django investment to build on.
2. **Regulatory scope** → jurisdiction-agnostic. Store NEC article
   numbers as *reference annotations* on each check's explanation
   string (traceability for US users) but drive the actual pass/fail
   thresholds (derating %, voltage-drop %) from configurable settings,
   not hardcoded citations. Avoids silently being wrong outside the US.
3. **Single-user vs. team** → build single-user-with-login from the
   start (a `User` row and `owner_id` FKs exist from Phase 2 on), but
   defer sharing/permissions UI to Phase 6. Cheaper to add the column
   now than to migrate ownership onto existing data later.
4. **Ampacity/voltage-drop tables** → hand-enter a starter table
   sourced from publicly published NEC Table 310.16 copper ampacity
   values (60/75/90°C columns) and standard AWG resistance-per-1000ft
   figures, seeded in Phase 2, with a clear `source` field per row so a
   user can correct/replace entries without a code change. Do not
   fabricate figures speculatively — flag any seeded row whose source
   isn't cross-checked as `unverified: true` until confirmed.
5. **Optimizer strength** → start with greedy LPT only for MVP (§4.3
   step 1); explicitly scope the local-search/ILP refinement (step 2)
   out of Phase 5 and into a follow-up phase, gated on real usage
   showing greedy is insufficient. Avoids over-building a solver before
   there's data on plot sizes/complexity in practice.
6. **`PROMPT_build.md`** → not authored by this pass (out of scope per
   this iteration's instructions — analysis/plan only, no other file
   writes). Should be the first artifact created once a human confirms
   this plan, or, absent that confirmation, the next iteration where
   moving to build mode is explicitly in scope.

---

## 8. Draft schema (Postgres, Phase 2 starting point)

Sketch only — field types/constraints to be finalized against the
chosen ORM (Prisma) during Phase 2, not applied now.

```sql
-- users: minimal auth, single-user-first per §7a.3
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- equipment_specs: user-editable catalog (§3)
CREATE TABLE equipment_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  power_watts NUMERIC,              -- nullable: amps-based specs allowed
  current_amps NUMERIC,
  voltage NUMERIC NOT NULL,
  power_factor NUMERIC,
  phase SMALLINT NOT NULL CHECK (phase IN (1, 3)),
  connector_type TEXT NOT NULL,
  is_continuous_load BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  source TEXT,
  unverified BOOLEAN NOT NULL DEFAULT false,  -- see §7a.4
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (power_watts IS NOT NULL OR current_amps IS NOT NULL)
);

-- cable_specs: catalog of cable/feeder types (§3)
CREATE TABLE cable_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gauge_awg TEXT NOT NULL,
  conductor_count SMALLINT NOT NULL,
  connector_type TEXT NOT NULL,
  rated_amps NUMERIC NOT NULL,
  resistance_ohms_per_1000ft NUMERIC NOT NULL,
  source TEXT,
  unverified BOOLEAN NOT NULL DEFAULT false
);

-- plots: top-level show/event container (§3)
CREATE TABLE plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  venue TEXT,
  event_date DATE,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- distro_units: physical power distribution boxes (§3)
CREATE TABLE distro_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  input_connector TEXT NOT NULL,
  max_amps NUMERIC NOT NULL,
  phase_config SMALLINT NOT NULL CHECK (phase_config IN (1, 3)),
  voltage NUMERIC NOT NULL
);

-- circuits: one breaker/output on a distro (§3)
CREATE TABLE circuits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distro_unit_id UUID NOT NULL REFERENCES distro_units(id) ON DELETE CASCADE,
  breaker_rating_amps NUMERIC NOT NULL,
  voltage NUMERIC NOT NULL,
  phase_leg TEXT NOT NULL,          -- 'L1' | 'L2' | 'L3' | 'hot' | 'neutral'
  connector_type TEXT NOT NULL,
  is_continuous_override BOOLEAN
);

-- equipment_instances: EquipmentSpec placed on a Plot's circuit (§3)
CREATE TABLE equipment_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  equipment_spec_id UUID NOT NULL REFERENCES equipment_specs(id),
  circuit_id UUID REFERENCES circuits(id),  -- null = unassigned
  cable_spec_id UUID REFERENCES cable_specs(id),
  cable_length_ft NUMERIC,
  quantity INTEGER NOT NULL DEFAULT 1,
  pinned BOOLEAN NOT NULL DEFAULT false     -- optimizer must not move this (§4.3.3)
);
```

---

## 9. API surface sketch (Phase 3 starting point)

REST, matching §3 entities 1:1 for CRUD, plus the analysis endpoint
that's the actual product value:

- `GET/POST /equipment-specs`, `GET/PATCH/DELETE /equipment-specs/:id`
- `GET/POST /cable-specs`, `GET/PATCH/DELETE /cable-specs/:id`
- `GET/POST /plots`, `GET/PATCH/DELETE /plots/:id`
- `POST /plots/:id/distro-units`, `PATCH/DELETE /distro-units/:id`
- `POST /distro-units/:id/circuits`, `PATCH/DELETE /circuits/:id`
- `POST /plots/:id/equipment-instances`,
  `PATCH/DELETE /equipment-instances/:id` (includes assign/unassign
  circuit, set `pinned`)
- `POST /plots/:id/analyze` → runs the §4 calc engine over the plot's
  current circuit/equipment graph; returns §4.4 output (per-circuit
  load %, per-leg totals + balance score, violations list, total draw
  vs. source capacity). Read-only, safe to call on every UI edit.
- `POST /plots/:id/auto-balance` → runs the §4.3 optimizer (greedy LPT
  for MVP per §7a.5), returns a *proposed* diff of circuit
  reassignments for unpinned equipment instances without applying it;
  a separate confirm step (`PATCH` on the affected instances) commits
  it. Keeps optimization a suggestion, not a silent mutation.

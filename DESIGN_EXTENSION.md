# Power Distro Calculator — Extension Design

Concrete design for `specs/extension.md`'s four items, derived from
`IMPLEMENTATION_PLAN.md` §10 (gap analysis + recommended build order).
Where `DESIGN.md` describes the as-built base system, this document
describes the delta on top of it: exactly which files change, which
new files are added, and the exact function signatures involved. All
file:line references below were re-verified directly against the
current source at doc-writing time (not copied from the plan
unchecked).

Build order (unchanged from plan §10.1, dependency-driven):

1. §2 — Delete distro/circuit buttons (bug fix, unblocks manual testing of 2-4)
2. §3 — Connector-type dropdown (produces canonical vocabulary §4 depends on)
3. §4 — Connector verification (depends on §3)
4. §5 — Cable length UI (independent; pure frontend wiring)

---

## 1. Architecture impact

No change to the system shape in `DESIGN.md` §1.1 — still
`web → api → Postgres` with `calc-engine`/`shared-types` imported
directly by both. The extension adds:

- **One new shared vocabulary module** (`packages/shared-types/src/connectorTypes.ts`)
  consumed by both `apps/web` (dropdowns) and `apps/api`
  (`connectorTable.ts`'s amp lookup) — replacing today's situation
  where the canonical list lives only in `apps/api/src/services/connectorTable.ts`
  and `apps/web` has no access to it across the `packages/*` import
  boundary.
- **One new calc-engine check** (`checkConnectorCompatibility`),
  wired into `analyze.ts` alongside the existing five checks — pure
  function, no I/O, same pattern as every other check.
- **No new API routes.** All four items are additive fields on
  existing DTOs/requests (`connectorType` on `EquipmentLoadInput`,
  `connectorType` on `CircuitInput.cable`) plus UI-only wiring to
  request bodies (`cableSpecId`/`cableLengthFt`) the API already
  accepts.
- **No schema migration required.** Every DB column the extension
  needs (`EquipmentSpec.connectorType`, `CableSpec.connectorType`,
  `EquipmentInstance.cableSpecId`/`cableLengthFt`) already exists in
  `apps/api/prisma/schema.prisma`; the gap is entirely in the mapping
  layer (`plotLoader.ts` / `buildPlotInput.ts`) and the frontend forms.

---

## 2. Item: fix delete distro / delete circuit buttons

**Root cause (unconfirmed pending manual repro, plan §10.5):** both
delete handlers in `apps/web/src/routes/PlotBuilderPage.tsx` are
`async` arrow functions invoked from a synchronous `onClick` with no
`.catch`:

```tsx
// PlotBuilderPage.tsx:158-165 (current)
onDeleteCircuit={async (circuitId) => {
  await api.circuits.remove(circuitId);
  plot.reload();
}}
onDeleteDistro={async (distroId) => {
  await api.distroUnits.remove(distroId);
  plot.reload();
}}
```

`DistroUnitCard.tsx:61` (`onClick={() => onDeleteDistro(distro.id)}`)
and `CircuitRow.tsx:30` (`onClick={onDelete}`) both fire this without
awaiting or handling rejection. `apiClient.ts`'s `request()`
(`apiClient.ts:19-32`) already `throw`s on any non-2xx response, but
nothing upstream catches it — a failed delete (404 from a stale id,
network blip, etc.) surfaces as an unhandled promise rejection in the
console and the UI silently does nothing, which matches the reported
symptom. Server-side routes and cascades are confirmed correct
(`distroUnits.routes.ts:30-33`, `circuits.routes.ts` equivalent,
migration FK cascades — `DistroUnit`/`Circuit` both `onDelete: Cascade`
in `schema.prisma:72,85`), so the fix is entirely in the click path,
not the backend.

**Modification — `apps/web/src/routes/PlotBuilderPage.tsx`:**

```tsx
onDeleteCircuit={async (circuitId) => {
  try {
    await api.circuits.remove(circuitId);
    plot.reload();
  } catch (err) {
    setError((err as Error).message); // new local error state, rendered near ViolationList
  }
}}
onDeleteDistro={async (distroId) => {
  try {
    await api.distroUnits.remove(distroId);
    plot.reload();
  } catch (err) {
    setError((err as Error).message);
  }
}}
```

Add a `const [error, setError] = useState<string | null>(null);` near
the other page-level state in `PlotBuilderPage.tsx`, and render it
(e.g. a dismissible banner above `ViolationList`) so failures are
visible instead of silent. This is the minimal fix — no change to
`apiClient.ts`, `useApi.ts`, routes, or schema.

**Verification step before considering this closed:** bring up
`docker-compose` + `apps/api` + `apps/web`, create a distro with a
circuit and an assigned equipment instance, click delete, and confirm
in the network tab whether it was actually a silent-throw (this fix)
or something else (e.g. stale id from unrefreshed state) — per plan
§10.5, don't guess-fix a bug that hasn't been observed firsthand.

**New test:** an `apps/api` integration test for `DELETE
/distro-units/:id` and `DELETE /circuits/:id` against a distro/circuit
that has an equipment instance attached (no `apps/api` tests exist
today — this would be the first).

---

## 3. Item: connector type as a dropdown

### 3.1 New file — `packages/shared-types/src/connectorTypes.ts`

```ts
export interface ConnectorTypeOption {
  value: string;   // canonical, lowercase, matches connectorTable.ts keys
  label: string;   // display text
  maxAmps: number;
}

export const CONNECTOR_TYPES: ConnectorTypeOption[] = [
  { value: 'edison',           label: 'Edison (NEMA 5-15)',   maxAmps: 15 },
  { value: 'nema 5-20',        label: 'NEMA 5-20',            maxAmps: 20 },
  { value: 'stage pin',        label: 'Stage Pin',            maxAmps: 20 },
  { value: 'l5-20',            label: 'Twist-Lock L5-20',     maxAmps: 20 },
  { value: 'l6-30',            label: 'Twist-Lock L6-30',     maxAmps: 30 },
  { value: 'powercon',         label: 'PowerCON TRUE1',       maxAmps: 20 },
  { value: 'iec c13',          label: 'IEC C13',              maxAmps: 10 },
  { value: 'iec c19',          label: 'IEC C19',              maxAmps: 16 },
  { value: 'socapex',          label: 'Socapex 19-pin',       maxAmps: 20 },
  { value: 'camlock',          label: 'Camlock 400A',         maxAmps: 400 },
];

export const OTHER_CONNECTOR_VALUE = 'other'; // sentinel for the custom-text escape hatch
```

One canonical `value` per physical connector (today's aliases —
`'edison'`/`'nema 5-15'`, `'camlock'`/`'cam-lok'`/`'camlock 400a'` in
`connectorTable.ts:10-28` — collapse to a single entry each; the plain
amp-lookup fallback for unrecognized strings is preserved via
`resolveConnectorMaxAmps`'s existing `?? fallbackAmps` behavior, §3.2
below).

### 3.2 Modification — `apps/api/src/services/connectorTable.ts`

Replace the hardcoded `CONNECTOR_MAX_AMPS` object with a derivation
from the shared list, so there is exactly one source of truth:

```ts
import { CONNECTOR_TYPES } from '@power-distro/shared-types';

const CONNECTOR_MAX_AMPS: Record<string, number> = Object.fromEntries(
  CONNECTOR_TYPES.map((c) => [c.value, c.maxAmps]),
);

export function resolveConnectorMaxAmps(connectorType: string, fallbackAmps: number): number {
  const known = CONNECTOR_MAX_AMPS[connectorType.trim().toLowerCase()];
  return known ?? fallbackAmps; // unchanged: unrecognized/custom strings fall back safely
}
```

### 3.3 Modification — four free-text `<input>`s become `<select>`s

Each gets the same shape: a `<select>` populated from
`CONNECTOR_TYPES`, plus an `${OTHER_CONNECTOR_VALUE}` option that
reveals a fallback `<input>` for custom/uncommon gear (preserves the
"log unusual equipment" capability from plan §7a.4 — a closed
dropdown with no escape hatch would regress that).

| File | Current | Change |
|---|---|---|
| `apps/web/src/components/catalog/EquipmentSpecForm.tsx:83-89` | free-text `<input>` bound to `connectorType` state | `<select>` + conditional "Other" `<input>` |
| `apps/web/src/components/catalog/CableSpecForm.tsx:37-43` | same | same |
| `apps/web/src/components/plot/DistroUnitCard.tsx:113-118` (add-circuit form) | same | same |
| `apps/web/src/routes/PlotBuilderPage.tsx:194` (add-distro form, `inputConnector`) | same | same |

Representative pattern (applied identically at each site, state
variable name varies):

```tsx
const [connectorType, setConnectorType] = useState(CONNECTOR_TYPES[0].value);
const [customConnector, setCustomConnector] = useState('');
// ...
<select
  value={connectorType}
  onChange={(e) => setConnectorType(e.target.value)}
>
  {CONNECTOR_TYPES.map((c) => (
    <option key={c.value} value={c.value}>{c.label}</option>
  ))}
  <option value={OTHER_CONNECTOR_VALUE}>Other / custom…</option>
</select>
{connectorType === OTHER_CONNECTOR_VALUE && (
  <input
    value={customConnector}
    onChange={(e) => setCustomConnector(e.target.value)}
    placeholder="Custom connector type"
  />
)}
```

On submit, each form sends `connectorType === OTHER_CONNECTOR_VALUE ?
customConnector : connectorType` as the string persisted — the stored
value on `EquipmentSpec`/`CableSpec`/`Circuit`/`DistroUnit` stays a
plain string column, no schema change.

---

## 4. Item: connector verification ("Edison must connect to Edison")

### 4.1 Modification — DTOs (two files, kept structurally identical
per the existing "redeclared, not imported" convention noted in
`packages/calc-engine/src/types.ts:1-6`)

`packages/calc-engine/src/types.ts` and
`packages/shared-types/src/analysis.ts`, identically:

```ts
export interface EquipmentLoadInput {
  // ...existing fields unchanged...
  connectorType: string;           // NEW
}

export interface CircuitInput {
  // ...existing fields unchanged...
  cable?: {
    ratedAmps: number;
    resistanceOhmsPer1000ft: number;
    lengthFt: number;
    connectorType?: string;        // NEW
  };
}

export type CheckId =
  | 'continuous_derating'
  | 'cable_ampacity'
  | 'connector_rating'
  | 'connector_compatibility'      // NEW
  | 'distro_capacity'
  | 'voltage_drop'
  | 'phase_leg_overcurrent';
```

### 4.2 New file — `packages/calc-engine/src/checks/connectorCompatibility.ts`

```ts
import type { CircuitInput, EquipmentLoadInput, Violation } from '../types.js';

function normalize(connector: string): string {
  return connector.trim().toLowerCase();
}

/**
 * Verifies each equipment item's connector matches what it's actually
 * plugged into (the cable's far end if a cable is present, else the
 * circuit's own connector directly), and that a bridging cable's
 * connector matches the circuit's output connector. Plan §10.2.
 */
export function checkConnectorCompatibility(
  circuit: CircuitInput,
  equipmentOnCircuit: EquipmentLoadInput[],
): Violation[] {
  const violations: Violation[] = [];

  if (circuit.cable?.connectorType &&
      normalize(circuit.cable.connectorType) !== normalize(circuit.connectorType)) {
    violations.push({
      severity: 'violation',
      checkId: 'connector_compatibility',
      circuitId: circuit.circuitId,
      message: `Cable connector (${circuit.cable.connectorType}) does not match circuit output connector (${circuit.connectorType}).`,
    });
  }

  const plugPoint = circuit.cable?.connectorType ?? circuit.connectorType;
  for (const item of equipmentOnCircuit) {
    if (normalize(item.connectorType) !== normalize(plugPoint)) {
      violations.push({
        severity: 'violation',
        checkId: 'connector_compatibility',
        circuitId: circuit.circuitId,
        message: `Equipment uses ${item.connectorType} but circuit provides ${plugPoint} — connector mismatch.`,
      });
    }
  }

  return violations;
}
```

### 4.3 Modification — `packages/calc-engine/src/analyze.ts`

`analyze.ts` currently only materializes per-circuit *load* via
`aggregateCircuitLoad` (`load.ts:18-26`), not the per-circuit item
list. `aggregateCircuitLoad` already filters `equipment` by
`item.circuitId === circuit.circuitId` internally — reuse that same
filter rather than duplicating it:

```ts
// analyze.ts, inside the existing per-circuit loop (currently lines 43-63):
const equipmentOnCircuit = input.equipment.filter((item) => item.circuitId === circuit.circuitId);
// ...
violations.push(...checkConnectorRating(circuit, loadAmps));
violations.push(...checkConnectorCompatibility(circuit, equipmentOnCircuit)); // NEW
violations.push(...checkVoltageDrop(circuit, loadAmps, input.voltageDropThresholdPct));
```

Plus the import line:
`import { checkConnectorCompatibility } from './checks/connectorCompatibility.js';`

### 4.4 Modification — `apps/api/src/services/plotLoader.ts`

Populate the two new fields from Prisma rows already being fetched
(`equipmentSpec.connectorType` and `cableSpec.connectorType` are
already selected via `include`, just not mapped):

```ts
// cableByCircuitId map (plotLoader.ts:29-40): add connectorType
{
  ratedAmps: Number(instance.cableSpec!.ratedAmps),
  resistanceOhmsPer1000ft: Number(instance.cableSpec!.resistanceOhmsPer1000ft),
  lengthFt: Number(instance.cableLengthFt),
  connectorType: instance.cableSpec!.connectorType,   // NEW
}

// equipment mapping (plotLoader.ts:66-79): add connectorType
{
  // ...existing fields...
  connectorType: instance.equipmentSpec.connectorType, // NEW
}
```

### 4.5 Modification — `apps/web/src/lib/buildPlotInput.ts`

Same two additions, mirrored exactly (client and server must stay in
lockstep per `DESIGN.md` §1.1's "same code, same answer" guarantee —
this file already redeclares the same mapping logic separately from
`plotLoader.ts`):

```ts
// cable attachment loop (buildPlotInput.ts:36-51):
circuit.cable = {
  ratedAmps: cableSpec.ratedAmps,
  resistanceOhmsPer1000ft: cableSpec.resistanceOhmsPer1000ft,
  lengthFt: instance.cableLengthFt,
  connectorType: cableSpec.connectorType,   // NEW
};

// equipment mapping (buildPlotInput.ts:53-65):
connectorType: spec?.connectorType ?? '',   // NEW
```

### 4.6 New test — `packages/calc-engine/test/connectorCompatibility.test.ts`

Cases: matching direct connection (no violation), mismatched direct
connection (violation), cable-bridged match (no violation),
cable-bridged mismatch on the circuit→cable side, cable-bridged
mismatch on the cable→equipment side.

---

## 5. Item: cable length calculations (UI wiring only)

**No calc-engine, API, or schema change** — `checkVoltageDrop` /
`computeVoltageDrop` (`packages/calc-engine/src/checks/voltageDrop.ts:9-43`)
already compute % drop from `circuit.cable.{resistanceOhmsPer1000ft,
lengthFt}`, are already unit-tested
(`packages/calc-engine/test/voltageDrop.test.ts`), and
`equipmentInstances.routes.ts`'s PATCH body already accepts
`cableSpecId`/`cableLengthFt` (`equipmentInstances.routes.ts:6-11`,
`25-33`). The gap is that nothing in `apps/web` ever sends those
fields: `buildPlotInput.ts:38`'s guard (`if (!instance.circuitId ||
!instance.cableSpecId || instance.cableLengthFt == null) continue;`)
is never satisfied today because no component renders a control for
either field.

### 5.1 Modification — `apps/web/src/components/plot/EquipmentInstanceDrop.tsx`

Add a per-instance-chip inline editor (chip rendering is already at
`EquipmentInstanceDrop.tsx:47-81`, one row per `InstanceChip`):

```tsx
interface Props {
  // ...existing props...
  cableSpecs: CableSpec[];                                        // NEW — passed down from PlotBuilderPage
  onSetCable: (instanceId: string, cableSpecId: string | null, lengthFt: number | null) => void; // NEW
}

// per chip:
<select
  value={chip.cableSpecId ?? ''}
  onChange={(e) => onSetCable(chip.instanceId, e.target.value || null, chip.cableLengthFt ?? null)}
>
  <option value="">No cable</option>
  {cableSpecs.map((c) => (
    <option key={c.id} value={c.id}>{c.gaugeAwg} · {c.connectorType} · {c.ratedAmps}A</option>
  ))}
</select>
<input
  type="number"
  value={chip.cableLengthFt ?? ''}
  onChange={(e) => onSetCable(chip.instanceId, chip.cableSpecId ?? null, Number(e.target.value) || null)}
  placeholder="ft"
  style={{ width: 60 }}
/>
{chip.voltageDropPct != null && <span>{chip.voltageDropPct.toFixed(1)}% drop</span>}
```

The `voltageDropPct` label surfaces the computed value even when
under threshold (today it only appears in `ViolationList` on
failure) — sourced from the client-side `useLiveAnalysis` report by
matching `circuitId`, not a new calc-engine call.

### 5.2 Modification — `apps/web/src/routes/PlotBuilderPage.tsx`

Thread `cableSpecs` (already fetched at `PlotBuilderPage.tsx:16` but
currently unused for this purpose) down through `DistroUnitCard` →
`CircuitRow` → `EquipmentInstanceDrop`, and add the handler:

```tsx
onSetCable={async (instanceId, cableSpecId, cableLengthFt) => {
  await api.equipmentInstances.update(instanceId, { cableSpecId, cableLengthFt });
  plot.reload();
}}
```

(This call site should use the same try/catch error-surfacing pattern
established in §2, rather than the pre-fix fire-and-forget style.)

### 5.3 Modification — `apps/web/src/components/plot/DistroUnitCard.tsx` and `CircuitRow.tsx`

Both need the new `cableSpecs: CableSpec[]` and `onSetCable` props
added to their `Props` interfaces and passed through unchanged to
`EquipmentInstanceDrop` — pure prop-drilling, no logic change.

---

## 6. Summary of files touched

**New files:**
- `packages/shared-types/src/connectorTypes.ts`
- `packages/calc-engine/src/checks/connectorCompatibility.ts`
- `packages/calc-engine/test/connectorCompatibility.test.ts`
- `apps/api/test/*` (first API test file, for the delete-button regression test)

**Modified files:**
- `packages/calc-engine/src/types.ts` — `connectorType` fields, `CheckId` union
- `packages/shared-types/src/analysis.ts` — same, mirrored
- `packages/calc-engine/src/analyze.ts` — wire new check into the loop
- `apps/api/src/services/connectorTable.ts` — derive from shared list
- `apps/api/src/services/plotLoader.ts` — populate new `connectorType` fields
- `apps/web/src/lib/buildPlotInput.ts` — mirror the same mapping
- `apps/web/src/routes/PlotBuilderPage.tsx` — delete error handling, `onSetCable` handler, add-distro dropdown
- `apps/web/src/components/catalog/EquipmentSpecForm.tsx` — connector dropdown
- `apps/web/src/components/catalog/CableSpecForm.tsx` — connector dropdown
- `apps/web/src/components/plot/DistroUnitCard.tsx` — connector dropdown (add-circuit), prop-drill `cableSpecs`/`onSetCable`
- `apps/web/src/components/plot/CircuitRow.tsx` — prop-drill `cableSpecs`/`onSetCable`
- `apps/web/src/components/plot/EquipmentInstanceDrop.tsx` — cable/length inline editor

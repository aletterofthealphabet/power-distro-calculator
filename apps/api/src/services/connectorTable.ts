// Connector-type → max-amps reference table (DESIGN.md §3.2 comment on
// CircuitInput.connectorMaxAmps: "resolved from a connector-type table").
// Free-text connectorType strings on Circuit/CableSpec/EquipmentSpec are
// matched case-insensitively; anything not listed here falls back to the
// circuit's own breakerRatingAmps (conservative — treats an unknown
// connector as at least as capable as the breaker feeding it, so it
// never manufactures a false failure, but also never silently hides a
// real connector limitation the catalog hasn't captured yet).
//
// Derived from the shared canonical list so apps/web's dropdowns and this
// amp lookup can never drift apart (packages/shared-types/src/connectorTypes.ts).

import { CONNECTOR_TYPES } from '@power-distro/shared-types';

const CONNECTOR_MAX_AMPS: Record<string, number> = Object.fromEntries(
  CONNECTOR_TYPES.map((c) => [c.value, c.maxAmps]),
);

export function resolveConnectorMaxAmps(connectorType: string, fallbackAmps: number): number {
  const known = CONNECTOR_MAX_AMPS[connectorType.trim().toLowerCase()];
  return known ?? fallbackAmps;
}

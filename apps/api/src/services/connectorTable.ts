// Connector-type → max-amps reference table (DESIGN.md §3.2 comment on
// CircuitInput.connectorMaxAmps: "resolved from a connector-type table").
// Free-text connectorType strings on Circuit/CableSpec/EquipmentSpec are
// matched case-insensitively; anything not listed here falls back to the
// circuit's own breakerRatingAmps (conservative — treats an unknown
// connector as at least as capable as the breaker feeding it, so it
// never manufactures a false failure, but also never silently hides a
// real connector limitation the catalog hasn't captured yet).

const CONNECTOR_MAX_AMPS: Record<string, number> = {
  'nema 5-15': 15,
  'edison': 15,
  'nema 5-20': 20,
  'stage pin': 20,
  'twist-lock l5-20': 20,
  'l5-20': 20,
  'twist-lock l6-30': 30,
  'l6-30': 30,
  'powercon true1': 20,
  'powercon': 20,
  'iec c13': 10,
  'iec c19': 16,
  'socapex 19-pin': 20,
  'socapex': 20,
  'camlock 400a': 400,
  'camlock': 400,
  'cam-lok': 400,
};

export function resolveConnectorMaxAmps(connectorType: string, fallbackAmps: number): number {
  const known = CONNECTOR_MAX_AMPS[connectorType.trim().toLowerCase()];
  return known ?? fallbackAmps;
}

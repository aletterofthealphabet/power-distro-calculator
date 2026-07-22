import type { CircuitInput, EquipmentLoadInput, Violation } from '../types.js';

function normalize(connector: string): string {
  return connector.trim().toLowerCase();
}

/**
 * Verifies each equipment item's connector matches what it's actually
 * plugged into (the cable's far end if a cable is present, else the
 * circuit's own connector directly), and that a bridging cable's
 * connector matches the circuit's output connector.
 */
export function checkConnectorCompatibility(
  circuit: CircuitInput,
  equipmentOnCircuit: EquipmentLoadInput[],
): Violation[] {
  const violations: Violation[] = [];

  if (
    circuit.cable?.connectorType &&
    normalize(circuit.cable.connectorType) !== normalize(circuit.connectorType)
  ) {
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

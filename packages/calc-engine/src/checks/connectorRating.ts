import type { CircuitInput, Violation } from '../types.js';
import type { Amps } from '../units.js';

/** Connector must be rated >= circuit load (plan §4.2). */
export function checkConnectorRating(circuit: CircuitInput, loadAmps: Amps): Violation[] {
  if (loadAmps <= circuit.connectorMaxAmps) {
    return [];
  }

  return [
    {
      severity: 'violation',
      checkId: 'connector_rating',
      circuitId: circuit.circuitId,
      message: `Load ${loadAmps.toFixed(1)}A exceeds the ${circuit.connectorType} connector's ${circuit.connectorMaxAmps}A rating.`,
    },
  ];
}

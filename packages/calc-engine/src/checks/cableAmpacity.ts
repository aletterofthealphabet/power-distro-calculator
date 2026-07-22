import type { CircuitInput, Violation } from '../types.js';
import type { Amps } from '../units.js';

/** loadAmps <= cable.ratedAmps AND cable.ratedAmps >= breakerRatingAmps (plan §4.2). */
export function checkCableAmpacity(circuit: CircuitInput, loadAmps: Amps): Violation[] {
  if (!circuit.cable) {
    return [];
  }

  const violations: Violation[] = [];
  const { ratedAmps } = circuit.cable;

  if (loadAmps > ratedAmps) {
    violations.push({
      severity: 'violation',
      checkId: 'cable_ampacity',
      circuitId: circuit.circuitId,
      message: `Load ${loadAmps.toFixed(1)}A exceeds cable ampacity of ${ratedAmps}A.`,
      necReference: 'NEC Table 310.16',
    });
  }

  if (ratedAmps < circuit.breakerRatingAmps) {
    violations.push({
      severity: 'violation',
      checkId: 'cable_ampacity',
      circuitId: circuit.circuitId,
      message: `Cable ampacity ${ratedAmps}A is below the ${circuit.breakerRatingAmps}A breaker it feeds — cable is not protected.`,
      necReference: 'NEC 240.4',
    });
  }

  return violations;
}

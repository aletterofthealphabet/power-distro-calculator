import type { CircuitInput, Violation } from '../types.js';
import type { Amps } from '../units.js';

const CONTINUOUS_DERATING_FACTOR = 0.8;

/** loadAmps <= 0.8 * breakerRatingAmps if continuous, else <= breakerRatingAmps (plan §4.2). */
export function checkContinuousDerating(circuit: CircuitInput, loadAmps: Amps): Violation[] {
  const isContinuous = circuit.isContinuousOverride ?? true;
  const limit = isContinuous
    ? circuit.breakerRatingAmps * CONTINUOUS_DERATING_FACTOR
    : circuit.breakerRatingAmps;

  if (loadAmps <= limit) {
    return [];
  }

  return [
    {
      severity: 'violation',
      checkId: 'continuous_derating',
      circuitId: circuit.circuitId,
      message: isContinuous
        ? `Continuous load ${loadAmps.toFixed(1)}A exceeds 80% of the ${circuit.breakerRatingAmps}A breaker (${limit.toFixed(1)}A limit).`
        : `Load ${loadAmps.toFixed(1)}A exceeds the ${circuit.breakerRatingAmps}A breaker rating.`,
      necReference: 'NEC 210.19/210.20',
    },
  ];
}

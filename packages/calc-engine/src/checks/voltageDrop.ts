import type { CircuitInput, Violation } from '../types.js';
import type { Amps } from '../units.js';

/**
 * % voltage drop for a single (one-way) conductor run:
 * Vdrop = 2 * I * R_per_ft * length_ft (round-trip, hot + return conductor);
 * pct = Vdrop / circuit.voltage * 100.
 */
export function computeVoltageDrop(circuit: CircuitInput, loadAmps: Amps): number {
  if (!circuit.cable) {
    return 0;
  }

  const { resistanceOhmsPer1000ft, lengthFt } = circuit.cable;
  const resistanceOhmsPerFt = resistanceOhmsPer1000ft / 1000;
  const voltageDropVolts = 2 * loadAmps * resistanceOhmsPerFt * lengthFt;
  return (voltageDropVolts / circuit.voltage) * 100;
}

/** Flags runs exceeding a configurable threshold (plan §4.2, DESIGN.md §5). */
export function checkVoltageDrop(
  circuit: CircuitInput,
  loadAmps: Amps,
  thresholdPct: number,
): Violation[] {
  if (!circuit.cable) {
    return [];
  }

  const dropPct = computeVoltageDrop(circuit, loadAmps);
  if (dropPct <= thresholdPct) {
    return [];
  }

  return [
    {
      severity: 'warning',
      checkId: 'voltage_drop',
      circuitId: circuit.circuitId,
      message: `Voltage drop ${dropPct.toFixed(1)}% exceeds the ${thresholdPct}% threshold over ${circuit.cable.lengthFt}ft.`,
    },
  ];
}

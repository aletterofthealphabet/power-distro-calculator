import type { PhaseLegResult } from '../types.js';

/** (max - min) / avg * 100 across a set of phase-leg totals (plan §4.3). */
export function computeDeviationPct(legs: PhaseLegResult[]): number {
  if (legs.length === 0) {
    return 0;
  }
  const totals = legs.map((l) => l.totalAmps);
  const max = Math.max(...totals);
  const min = Math.min(...totals);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  if (avg === 0) {
    return 0;
  }
  return ((max - min) / avg) * 100;
}

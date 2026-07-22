import type { DistroInput, PhaseLegResult, Violation } from '../types.js';

/**
 * Each phase leg's total current must not exceed the source's per-leg
 * rating even if the panel total is fine (plan §4.2). Per-leg rating is
 * approximated as the distro's maxAmps (the same current limit applies
 * per conductor on the input feed) since DistroInput doesn't currently
 * model separate per-leg breaker ratings.
 */
export function checkPhaseLegOvercurrent(
  legTotals: PhaseLegResult[],
  distro: DistroInput,
): Violation[] {
  const violations: Violation[] = [];

  for (const leg of legTotals.filter((l) => l.distroUnitId === distro.distroUnitId)) {
    if (leg.totalAmps > distro.maxAmps) {
      violations.push({
        severity: 'violation',
        checkId: 'phase_leg_overcurrent',
        distroUnitId: distro.distroUnitId,
        message: `Phase leg ${leg.leg} total ${leg.totalAmps.toFixed(1)}A exceeds the distro's ${distro.maxAmps}A per-leg limit.`,
      });
    }
  }

  return violations;
}

import type { CircuitResult, DistroInput, Violation } from '../types.js';

/** Σ circuit loads on this distro <= distro.maxAmps (plan §4.2). */
export function checkDistroCapacity(
  distro: DistroInput,
  circuitLoads: CircuitResult[],
): Violation[] {
  const circuitIds = new Set(distro.circuits.map((c) => c.circuitId));
  const total = circuitLoads
    .filter((c) => circuitIds.has(c.circuitId))
    .reduce((sum, c) => sum + c.loadAmps, 0);

  if (total <= distro.maxAmps) {
    return [];
  }

  return [
    {
      severity: 'violation',
      checkId: 'distro_capacity',
      distroUnitId: distro.distroUnitId,
      message: `Total distro load ${total.toFixed(1)}A exceeds the distro's ${distro.maxAmps}A main capacity.`,
    },
  ];
}

import type {
  BalanceProposal,
  BalanceResult,
  DistroInput,
  EquipmentLoadInput,
  PhaseLegResult,
} from '../types.js';
import { computeItemAmps } from '../load.js';
import { computeDeviationPct } from './deviation.js';

/**
 * Greedy LPT phase balancer (plan §4.3 step 1 / MVP):
 * 1. Sort unpinned items (belonging to this distro) by amps descending.
 * 2. Assign each to the currently-lightest leg, but only among circuits
 *    that already physically exist on this distro (the cabling-aware
 *    constraint — this never invents a new circuit/leg for an item).
 * 3. Pinned items keep their current circuit and count toward leg
 *    totals, but are never reassigned.
 * Returns a proposal only; nothing here mutates equipment/circuit state.
 */
export function balanceGreedyLpt(
  distro: DistroInput,
  equipment: EquipmentLoadInput[],
): BalanceProposal {
  const circuitLegById = new Map(distro.circuits.map((c) => [c.circuitId, c.phaseLeg]));
  const legTotals = new Map<string, number>();
  for (const circuit of distro.circuits) {
    if (!legTotals.has(circuit.phaseLeg)) {
      legTotals.set(circuit.phaseLeg, 0);
    }
  }

  const relevantItems = equipment.filter(
    (item) => item.circuitId !== null && circuitLegById.has(item.circuitId),
  );
  const pinned = relevantItems.filter((item) => item.pinned);
  const unpinned = relevantItems.filter((item) => !item.pinned);

  const proposed: BalanceProposal['proposed'] = [];

  for (const item of pinned) {
    const leg = circuitLegById.get(item.circuitId as string) as string;
    const amps = computeItemAmps(item) * item.quantity;
    legTotals.set(leg, (legTotals.get(leg) ?? 0) + amps);
  }

  const sortedUnpinned = [...unpinned].sort(
    (a, b) => computeItemAmps(b) * b.quantity - computeItemAmps(a) * a.quantity,
  );

  for (const item of sortedUnpinned) {
    const amps = computeItemAmps(item) * item.quantity;

    let lightestLeg = '';
    let lightestTotal = Infinity;
    for (const [leg, total] of legTotals) {
      if (total < lightestTotal) {
        lightestTotal = total;
        lightestLeg = leg;
      }
    }

    const targetCircuit = distro.circuits.find((c) => c.phaseLeg === lightestLeg);
    if (!targetCircuit) {
      continue;
    }

    legTotals.set(lightestLeg, lightestTotal + amps);

    if (targetCircuit.circuitId !== item.circuitId) {
      proposed.push({
        instanceId: item.instanceId,
        fromCircuitId: item.circuitId,
        toCircuitId: targetCircuit.circuitId,
      });
    }
  }

  const legs: PhaseLegResult[] = [...legTotals].map(([leg, totalAmps]) => ({
    distroUnitId: distro.distroUnitId,
    leg,
    totalAmps,
  }));

  const projectedBalance: BalanceResult = {
    legs,
    deviationPct: computeDeviationPct(legs),
  };

  return { proposed, projectedBalance };
}

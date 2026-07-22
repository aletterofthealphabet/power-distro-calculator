import { describe, expect, it } from 'vitest';
import { balanceGreedyLpt } from '../src/balance/greedyLpt.js';
import type { DistroInput, EquipmentLoadInput } from '../src/types.js';

function distroWithLegs(): DistroInput {
  return {
    distroUnitId: 'd1',
    maxAmps: 400,
    phaseConfig: 3,
    circuits: [
      { circuitId: 'c-L1', breakerRatingAmps: 100, voltage: 208, phaseLeg: 'L1', connectorType: 'cam', connectorMaxAmps: 100 },
      { circuitId: 'c-L2', breakerRatingAmps: 100, voltage: 208, phaseLeg: 'L2', connectorType: 'cam', connectorMaxAmps: 100 },
      { circuitId: 'c-L3', breakerRatingAmps: 100, voltage: 208, phaseLeg: 'L3', connectorType: 'cam', connectorMaxAmps: 100 },
    ],
  };
}

function item(overrides: Partial<EquipmentLoadInput>): EquipmentLoadInput {
  return {
    instanceId: 'i',
    quantity: 1,
    voltage: 208,
    isContinuousLoad: true,
    circuitId: null,
    pinned: false,
    ...overrides,
  };
}

describe('balanceGreedyLpt', () => {
  it('spreads unpinned items evenly across legs by descending load (LPT)', () => {
    const distro = distroWithLegs();
    const equipment: EquipmentLoadInput[] = [
      item({ instanceId: 'a', currentAmps: 30, circuitId: 'c-L1' }),
      item({ instanceId: 'b', currentAmps: 20, circuitId: 'c-L1' }),
      item({ instanceId: 'c', currentAmps: 10, circuitId: 'c-L1' }),
    ];

    const result = balanceGreedyLpt(distro, equipment);

    // Largest (a, 30A) goes first — some leg is at 0, ties broken by
    // iteration order, so it stays or moves to whichever leg is "lightest".
    // What matters: final deviation is much lower than dumping everything
    // on L1 (60A vs 0/0), and every item ends up assigned to a distro leg.
    expect(result.projectedBalance.legs).toHaveLength(3);
    const totals = result.projectedBalance.legs.map((l) => l.totalAmps).sort((x, y) => x - y);
    expect(totals).toEqual([10, 20, 30]);
    // (max - min) / avg * 100 = (30 - 10) / 20 * 100 = 100
    expect(result.projectedBalance.deviationPct).toBeCloseTo(100, 5);
  });

  it('never reassigns pinned items but still counts their load', () => {
    const distro = distroWithLegs();
    const equipment: EquipmentLoadInput[] = [
      item({ instanceId: 'pinned-a', currentAmps: 50, circuitId: 'c-L1', pinned: true }),
      item({ instanceId: 'movable-b', currentAmps: 10, circuitId: 'c-L1' }),
    ];

    const result = balanceGreedyLpt(distro, equipment);

    expect(result.proposed.find((p) => p.instanceId === 'pinned-a')).toBeUndefined();
    // movable-b should move off L1 (already at 50A from the pin) onto an empty leg.
    const moved = result.proposed.find((p) => p.instanceId === 'movable-b');
    expect(moved).toBeDefined();
    expect(moved?.toCircuitId).not.toBe('c-L1');
  });

  it('ignores items not assigned to a circuit on this distro', () => {
    const distro = distroWithLegs();
    const equipment: EquipmentLoadInput[] = [
      item({ instanceId: 'elsewhere', currentAmps: 999, circuitId: 'circuit-on-other-distro' }),
      item({ instanceId: 'unassigned', currentAmps: 999, circuitId: null }),
    ];

    const result = balanceGreedyLpt(distro, equipment);

    expect(result.proposed).toEqual([]);
    expect(result.projectedBalance.legs.every((l) => l.totalAmps === 0)).toBe(true);
  });

  it('produces no proposals when nothing needs to move', () => {
    const distro = distroWithLegs();
    const equipment: EquipmentLoadInput[] = [];
    const result = balanceGreedyLpt(distro, equipment);
    expect(result.proposed).toEqual([]);
    expect(result.projectedBalance.deviationPct).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { checkDistroCapacity } from '../src/checks/distroCapacity.js';
import type { CircuitResult, DistroInput } from '../src/types.js';

function baseDistro(overrides: Partial<DistroInput> = {}): DistroInput {
  return {
    distroUnitId: 'd1',
    maxAmps: 100,
    phaseConfig: 3,
    circuits: [
      { circuitId: 'c1', breakerRatingAmps: 50, voltage: 208, phaseLeg: 'L1', connectorType: 'cam', connectorMaxAmps: 50 },
      { circuitId: 'c2', breakerRatingAmps: 50, voltage: 208, phaseLeg: 'L2', connectorType: 'cam', connectorMaxAmps: 50 },
    ],
    ...overrides,
  };
}

describe('checkDistroCapacity', () => {
  it('passes when total circuit load is within distro maxAmps', () => {
    const distro = baseDistro();
    const loads: CircuitResult[] = [
      { circuitId: 'c1', loadAmps: 40, loadPct: 80 },
      { circuitId: 'c2', loadAmps: 40, loadPct: 80 },
    ];
    expect(checkDistroCapacity(distro, loads)).toEqual([]);
  });

  it('fails when total circuit load exceeds distro maxAmps', () => {
    const distro = baseDistro();
    const loads: CircuitResult[] = [
      { circuitId: 'c1', loadAmps: 60, loadPct: 120 },
      { circuitId: 'c2', loadAmps: 60, loadPct: 120 },
    ];
    const violations = checkDistroCapacity(distro, loads);
    expect(violations).toHaveLength(1);
    expect(violations[0].checkId).toBe('distro_capacity');
  });

  it('ignores circuit loads that belong to a different distro', () => {
    const distro = baseDistro();
    const loads: CircuitResult[] = [{ circuitId: 'unrelated', loadAmps: 500, loadPct: 1000 }];
    expect(checkDistroCapacity(distro, loads)).toEqual([]);
  });
});

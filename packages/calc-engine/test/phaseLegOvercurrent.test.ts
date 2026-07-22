import { describe, expect, it } from 'vitest';
import { checkPhaseLegOvercurrent } from '../src/checks/phaseLegOvercurrent.js';
import type { DistroInput, PhaseLegResult } from '../src/types.js';

function baseDistro(overrides: Partial<DistroInput> = {}): DistroInput {
  return {
    distroUnitId: 'd1',
    maxAmps: 100,
    phaseConfig: 3,
    circuits: [],
    ...overrides,
  };
}

describe('checkPhaseLegOvercurrent', () => {
  it('passes when every leg is within the distro limit', () => {
    const legs: PhaseLegResult[] = [
      { distroUnitId: 'd1', leg: 'L1', totalAmps: 90 },
      { distroUnitId: 'd1', leg: 'L2', totalAmps: 100 },
    ];
    expect(checkPhaseLegOvercurrent(legs, baseDistro())).toEqual([]);
  });

  it('fails for a leg exceeding the distro limit even if others are fine', () => {
    const legs: PhaseLegResult[] = [
      { distroUnitId: 'd1', leg: 'L1', totalAmps: 50 },
      { distroUnitId: 'd1', leg: 'L2', totalAmps: 110 },
    ];
    const violations = checkPhaseLegOvercurrent(legs, baseDistro());
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('L2');
  });

  it('ignores legs belonging to a different distro', () => {
    const legs: PhaseLegResult[] = [{ distroUnitId: 'other-distro', leg: 'L1', totalAmps: 999 }];
    expect(checkPhaseLegOvercurrent(legs, baseDistro())).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { checkVoltageDrop, computeVoltageDrop } from '../src/checks/voltageDrop.js';
import type { CircuitInput } from '../src/types.js';
import { asAmps } from '../src/units.js';

function baseCircuit(overrides: Partial<CircuitInput> = {}): CircuitInput {
  return {
    circuitId: 'c1',
    breakerRatingAmps: 20,
    voltage: 120,
    phaseLeg: 'hot',
    connectorType: 'Edison',
    connectorMaxAmps: 20,
    cable: { ratedAmps: 25, resistanceOhmsPer1000ft: 1.93, lengthFt: 100 },
    ...overrides,
  };
}

describe('computeVoltageDrop', () => {
  it('returns 0 when no cable is specified', () => {
    const circuit = baseCircuit({ cable: undefined });
    expect(computeVoltageDrop(circuit, asAmps(10))).toBe(0);
  });

  it('computes round-trip percentage drop from resistance and length', () => {
    const circuit = baseCircuit();
    // Vdrop = 2 * 10A * (1.93/1000) * 100ft = 3.86V; pct = 3.86/120*100 = 3.2166...
    const pct = computeVoltageDrop(circuit, asAmps(10));
    expect(pct).toBeCloseTo(3.2167, 3);
  });
});

describe('checkVoltageDrop', () => {
  it('passes under the threshold', () => {
    const circuit = baseCircuit();
    expect(checkVoltageDrop(circuit, asAmps(10), 5)).toEqual([]);
  });

  it('warns over the threshold', () => {
    const circuit = baseCircuit();
    const violations = checkVoltageDrop(circuit, asAmps(10), 3);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('warning');
    expect(violations[0].checkId).toBe('voltage_drop');
  });
});

import { describe, expect, it } from 'vitest';
import { checkContinuousDerating } from '../src/checks/continuousDerating.js';
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
    ...overrides,
  };
}

describe('checkContinuousDerating', () => {
  it('passes at exactly 80% for a continuous load', () => {
    const circuit = baseCircuit();
    expect(checkContinuousDerating(circuit, asAmps(16))).toEqual([]);
  });

  it('fails just above 80% for a continuous load', () => {
    const circuit = baseCircuit();
    const violations = checkContinuousDerating(circuit, asAmps(16.1));
    expect(violations).toHaveLength(1);
    expect(violations[0].checkId).toBe('continuous_derating');
    expect(violations[0].severity).toBe('violation');
  });

  it('allows up to 100% when explicitly marked non-continuous', () => {
    const circuit = baseCircuit({ isContinuousOverride: false });
    expect(checkContinuousDerating(circuit, asAmps(20))).toEqual([]);
  });

  it('fails above 100% even when non-continuous', () => {
    const circuit = baseCircuit({ isContinuousOverride: false });
    expect(checkContinuousDerating(circuit, asAmps(20.1))).toHaveLength(1);
  });

  it('defaults to continuous when isContinuousOverride is unset', () => {
    const circuit = baseCircuit();
    expect(checkContinuousDerating(circuit, asAmps(17))).toHaveLength(1);
  });
});

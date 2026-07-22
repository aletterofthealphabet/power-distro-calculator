import { describe, expect, it } from 'vitest';
import { checkCableAmpacity } from '../src/checks/cableAmpacity.js';
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
    cable: { ratedAmps: 25, resistanceOhmsPer1000ft: 1.93, lengthFt: 50 },
    ...overrides,
  };
}

describe('checkCableAmpacity', () => {
  it('passes when no cable is specified', () => {
    const circuit = baseCircuit({ cable: undefined });
    expect(checkCableAmpacity(circuit, asAmps(100))).toEqual([]);
  });

  it('passes when load is within cable rating and cable protects the breaker', () => {
    const circuit = baseCircuit();
    expect(checkCableAmpacity(circuit, asAmps(15))).toEqual([]);
  });

  it('fails when load exceeds cable ampacity', () => {
    const circuit = baseCircuit({ cable: { ratedAmps: 20, resistanceOhmsPer1000ft: 1.93, lengthFt: 50 } });
    const violations = checkCableAmpacity(circuit, asAmps(25));
    expect(violations.some((v) => v.message.includes('exceeds cable ampacity'))).toBe(true);
  });

  it('fails when cable rating is below the breaker it feeds', () => {
    const circuit = baseCircuit({
      breakerRatingAmps: 30,
      cable: { ratedAmps: 20, resistanceOhmsPer1000ft: 1.93, lengthFt: 50 },
    });
    const violations = checkCableAmpacity(circuit, asAmps(15));
    expect(violations.some((v) => v.message.includes('not protected'))).toBe(true);
  });
});

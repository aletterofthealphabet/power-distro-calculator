import { describe, expect, it } from 'vitest';
import { checkConnectorRating } from '../src/checks/connectorRating.js';
import type { CircuitInput } from '../src/types.js';
import { asAmps } from '../src/units.js';

function baseCircuit(overrides: Partial<CircuitInput> = {}): CircuitInput {
  return {
    circuitId: 'c1',
    breakerRatingAmps: 20,
    voltage: 120,
    phaseLeg: 'hot',
    connectorType: 'stage pin',
    connectorMaxAmps: 20,
    ...overrides,
  };
}

describe('checkConnectorRating', () => {
  it('passes when load is at or below connector rating', () => {
    expect(checkConnectorRating(baseCircuit(), asAmps(20))).toEqual([]);
  });

  it('fails when load exceeds connector rating', () => {
    const violations = checkConnectorRating(baseCircuit(), asAmps(25));
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('stage pin');
  });
});

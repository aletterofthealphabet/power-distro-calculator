import { describe, expect, it } from 'vitest';
import { aggregateCircuitLoad, computeItemAmps } from '../src/load.js';
import type { CircuitInput, EquipmentLoadInput } from '../src/types.js';

function baseItem(overrides: Partial<EquipmentLoadInput> = {}): EquipmentLoadInput {
  return {
    instanceId: 'item-1',
    quantity: 1,
    voltage: 120,
    isContinuousLoad: true,
    circuitId: 'circuit-1',
    pinned: false,
    ...overrides,
  };
}

function baseCircuit(overrides: Partial<CircuitInput> = {}): CircuitInput {
  return {
    circuitId: 'circuit-1',
    breakerRatingAmps: 20,
    voltage: 120,
    phaseLeg: 'hot',
    connectorType: 'Edison',
    connectorMaxAmps: 20,
    ...overrides,
  };
}

describe('computeItemAmps', () => {
  it('uses currentAmps directly when given', () => {
    const item = baseItem({ currentAmps: 5.5, powerWatts: 999 });
    expect(computeItemAmps(item)).toBe(5.5);
  });

  it('derives amps from watts / voltage when currentAmps is absent', () => {
    const item = baseItem({ powerWatts: 1200, voltage: 120 });
    expect(computeItemAmps(item)).toBe(10);
  });

  it('throws when neither currentAmps nor powerWatts is given', () => {
    const item = baseItem();
    expect(() => computeItemAmps(item)).toThrow();
  });
});

describe('aggregateCircuitLoad', () => {
  it('sums amps * quantity for items assigned to the circuit', () => {
    const circuit = baseCircuit();
    const equipment = [
      baseItem({ instanceId: 'a', powerWatts: 1200, voltage: 120, quantity: 2 }), // 10A * 2 = 20A
      baseItem({ instanceId: 'b', currentAmps: 3, quantity: 1 }),
    ];
    expect(aggregateCircuitLoad(circuit, equipment)).toBe(23);
  });

  it('ignores items assigned to a different circuit', () => {
    const circuit = baseCircuit({ circuitId: 'circuit-1' });
    const equipment = [baseItem({ circuitId: 'circuit-2', currentAmps: 10 })];
    expect(aggregateCircuitLoad(circuit, equipment)).toBe(0);
  });

  it('ignores unassigned items', () => {
    const circuit = baseCircuit();
    const equipment = [baseItem({ circuitId: null, currentAmps: 10 })];
    expect(aggregateCircuitLoad(circuit, equipment)).toBe(0);
  });
});

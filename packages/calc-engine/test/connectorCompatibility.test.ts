import { describe, expect, it } from 'vitest';
import { checkConnectorCompatibility } from '../src/checks/connectorCompatibility.js';
import type { CircuitInput, EquipmentLoadInput } from '../src/types.js';

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

function baseEquipment(overrides: Partial<EquipmentLoadInput> = {}): EquipmentLoadInput {
  return {
    instanceId: 'i1',
    quantity: 1,
    powerWatts: 500,
    voltage: 120,
    isContinuousLoad: true,
    circuitId: 'c1',
    pinned: false,
    connectorType: 'stage pin',
    ...overrides,
  };
}

describe('checkConnectorCompatibility', () => {
  it('passes when equipment connector matches the circuit directly (no cable)', () => {
    const circuit = baseCircuit();
    const equipment = [baseEquipment()];
    expect(checkConnectorCompatibility(circuit, equipment)).toEqual([]);
  });

  it('fails when equipment connector mismatches the circuit directly (no cable)', () => {
    const circuit = baseCircuit({ connectorType: 'edison' });
    const equipment = [baseEquipment({ connectorType: 'stage pin' })];
    const violations = checkConnectorCompatibility(circuit, equipment);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('stage pin');
    expect(violations[0].message).toContain('edison');
  });

  it('passes when equipment matches a bridging cable that matches the circuit', () => {
    const circuit = baseCircuit({
      connectorType: 'stage pin',
      cable: { ratedAmps: 20, resistanceOhmsPer1000ft: 1.93, lengthFt: 50, connectorType: 'stage pin' },
    });
    const equipment = [baseEquipment({ connectorType: 'stage pin' })];
    expect(checkConnectorCompatibility(circuit, equipment)).toEqual([]);
  });

  it('fails when the cable connector mismatches the circuit output connector', () => {
    const circuit = baseCircuit({
      connectorType: 'edison',
      cable: { ratedAmps: 20, resistanceOhmsPer1000ft: 1.93, lengthFt: 50, connectorType: 'stage pin' },
    });
    const equipment = [baseEquipment({ connectorType: 'stage pin' })];
    const violations = checkConnectorCompatibility(circuit, equipment);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('Cable connector');
  });

  it('fails when equipment mismatches the cable connector on the far end', () => {
    const circuit = baseCircuit({
      connectorType: 'stage pin',
      cable: { ratedAmps: 20, resistanceOhmsPer1000ft: 1.93, lengthFt: 50, connectorType: 'stage pin' },
    });
    const equipment = [baseEquipment({ connectorType: 'edison' })];
    const violations = checkConnectorCompatibility(circuit, equipment);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('Equipment uses edison');
  });
});

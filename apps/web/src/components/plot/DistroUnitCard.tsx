import { useState } from 'react';
import type { Circuit, DistroUnit } from '@power-distro/shared-types';
import type { CircuitResult, PhaseLegResult } from '@power-distro/calc-engine';
import { CircuitRow } from './CircuitRow';
import { PhaseBalanceBar } from './PhaseBalanceBar';
import type { InstanceChip } from './EquipmentInstanceDrop';

interface Props {
  distro: DistroUnit;
  circuits: Circuit[];
  circuitResults: Map<string, CircuitResult>;
  legs: PhaseLegResult[];
  instancesByCircuit: Map<string, InstanceChip[]>;
  onAddCircuit: (distroId: string, body: Partial<Circuit>) => void;
  onDeleteCircuit: (id: string) => void;
  onDeleteDistro: (id: string) => void;
  onDropInstance: (instanceId: string, circuitId: string) => void;
  onTogglePin: (instanceId: string, pinned: boolean) => void;
  onRemoveInstance: (instanceId: string) => void;
}

const PHASE_LEGS = ['L1', 'L2', 'L3', 'hot', 'neutral'] as const;

function distroDeviationPct(legs: PhaseLegResult[]): number {
  if (legs.length === 0) return 0;
  const totals = legs.map((l) => l.totalAmps);
  const max = Math.max(...totals);
  const min = Math.min(...totals);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  return avg > 0 ? ((max - min) / avg) * 100 : 0;
}

export function DistroUnitCard({
  distro,
  circuits,
  circuitResults,
  legs,
  instancesByCircuit,
  onAddCircuit,
  onDeleteCircuit,
  onDeleteDistro,
  onDropInstance,
  onTogglePin,
  onRemoveInstance,
}: Props) {
  const [showAddCircuit, setShowAddCircuit] = useState(false);
  const [breakerRatingAmps, setBreakerRatingAmps] = useState(20);
  const [voltage, setVoltage] = useState(distro.voltage);
  const [phaseLeg, setPhaseLeg] = useState<(typeof PHASE_LEGS)[number]>('L1');
  const [connectorType, setConnectorType] = useState('stage pin');

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>{distro.name}</h3>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {distro.inputConnector} · {distro.maxAmps}A max · {distro.phaseConfig}φ · {distro.voltage}V
          </div>
        </div>
        <button onClick={() => onDeleteDistro(distro.id)} style={{ color: '#b3261e' }}>
          Delete distro
        </button>
      </div>

      <div style={{ marginTop: 10, marginBottom: 10 }}>
        <PhaseBalanceBar legs={legs} deviationPct={distroDeviationPct(legs)} />
      </div>

      {circuits.map((circuit) => (
        <CircuitRow
          key={circuit.id}
          circuit={circuit}
          result={circuitResults.get(circuit.id)}
          instances={instancesByCircuit.get(circuit.id) ?? []}
          onDropInstance={(instanceId) => onDropInstance(instanceId, circuit.id)}
          onTogglePin={onTogglePin}
          onRemove={onRemoveInstance}
          onDelete={() => onDeleteCircuit(circuit.id)}
        />
      ))}

      {showAddCircuit ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddCircuit(distro.id, { breakerRatingAmps, voltage, phaseLeg, connectorType });
            setShowAddCircuit(false);
          }}
          style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}
        >
          <input
            type="number"
            value={breakerRatingAmps}
            onChange={(e) => setBreakerRatingAmps(Number(e.target.value))}
            placeholder="Breaker A"
            style={{ width: 90 }}
          />
          <input
            type="number"
            value={voltage}
            onChange={(e) => setVoltage(Number(e.target.value))}
            placeholder="Voltage"
            style={{ width: 90 }}
          />
          <select value={phaseLeg} onChange={(e) => setPhaseLeg(e.target.value as (typeof PHASE_LEGS)[number])}>
            {PHASE_LEGS.map((leg) => (
              <option key={leg} value={leg}>
                {leg}
              </option>
            ))}
          </select>
          <input
            value={connectorType}
            onChange={(e) => setConnectorType(e.target.value)}
            placeholder="Connector type"
            style={{ width: 140 }}
          />
          <button type="submit">Add</button>
          <button type="button" onClick={() => setShowAddCircuit(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <button onClick={() => setShowAddCircuit(true)} style={{ marginTop: 8 }}>
          + Add circuit
        </button>
      )}
    </div>
  );
}

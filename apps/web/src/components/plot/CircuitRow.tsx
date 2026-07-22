import type { Circuit } from '@power-distro/shared-types';
import type { CircuitResult } from '@power-distro/calc-engine';
import { EquipmentInstanceDrop, type InstanceChip } from './EquipmentInstanceDrop';

interface Props {
  circuit: Circuit;
  result: CircuitResult | undefined;
  instances: InstanceChip[];
  onDropInstance: (instanceId: string) => void;
  onTogglePin: (instanceId: string, pinned: boolean) => void;
  onRemove: (instanceId: string) => void;
  onDelete: () => void;
}

export function CircuitRow({ circuit, result, instances, onDropInstance, onTogglePin, onRemove, onDelete }: Props) {
  const loadPct = result?.loadPct ?? 0;
  const loadColor = loadPct > 100 ? '#b3261e' : loadPct > 80 ? '#9a5b00' : '#1e7e34';

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontSize: 13 }}>
          <strong>{circuit.phaseLeg}</strong> · {circuit.breakerRatingAmps}A breaker · {circuit.connectorType} ·{' '}
          {circuit.voltage}V
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: loadColor, fontFamily: 'monospace', fontSize: 13 }}>
            {(result?.loadAmps ?? 0).toFixed(1)}A ({loadPct.toFixed(0)}%)
          </span>
          <button onClick={onDelete} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#b3261e' }}>
            Delete circuit
          </button>
        </div>
      </div>
      <EquipmentInstanceDrop
        instances={instances}
        onDropInstance={onDropInstance}
        onTogglePin={onTogglePin}
        onRemove={onRemove}
      />
    </div>
  );
}

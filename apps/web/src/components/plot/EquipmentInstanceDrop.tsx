import { useState } from 'react';
import type { EquipmentInstance, EquipmentSpec } from '@power-distro/shared-types';

export interface InstanceChip {
  instance: EquipmentInstance;
  spec: EquipmentSpec | undefined;
}

interface Props {
  instances: InstanceChip[];
  onDropInstance: (instanceId: string) => void;
  onTogglePin: (instanceId: string, pinned: boolean) => void;
  onRemove: (instanceId: string) => void;
}

/** Drag-drop target for assigning an EquipmentInstance to a circuit (DESIGN.md §2). */
export function EquipmentInstanceDrop({ instances, onDropInstance, onTogglePin, onRemove }: Props) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const instanceId = e.dataTransfer.getData('text/instance-id');
        if (instanceId) {
          onDropInstance(instanceId);
        }
      }}
      style={{
        minHeight: 44,
        border: `2px dashed ${isOver ? '#3b82f6' : '#ccc'}`,
        borderRadius: 6,
        padding: 8,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        background: isOver ? '#eff6ff' : 'transparent',
      }}
    >
      {instances.length === 0 && <span style={{ opacity: 0.5, fontSize: 13 }}>Drop equipment here</span>}
      {instances.map(({ instance, spec }) => (
        <div
          key={instance.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/instance-id', instance.id)}
          style={{
            background: instance.pinned ? '#fef3c7' : '#e5e7eb',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'grab',
          }}
        >
          <span>
            {spec?.name ?? 'Unknown spec'} ×{instance.quantity}
          </span>
          <button
            title={instance.pinned ? 'Unpin' : 'Pin (optimizer will not move this)'}
            onClick={() => onTogglePin(instance.id, !instance.pinned)}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            {instance.pinned ? '📌' : '📍'}
          </button>
          <button
            title="Remove"
            onClick={() => onRemove(instance.id)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#b3261e' }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

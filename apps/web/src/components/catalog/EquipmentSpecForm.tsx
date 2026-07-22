import { useState } from 'react';
import type { EquipmentSpec } from '@power-distro/shared-types';
import { CONNECTOR_TYPES, OTHER_CONNECTOR_VALUE } from '@power-distro/shared-types';

const CATEGORIES = ['lighting fixture', 'LED fixture', 'moving light', 'hazer', 'video wall', 'audio amp', 'motor', 'practical', 'other'];

export function EquipmentSpecForm({ onSubmit }: { onSubmit: (spec: Partial<EquipmentSpec>) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [specMode, setSpecMode] = useState<'watts' | 'amps'>('watts');
  const [powerWatts, setPowerWatts] = useState<number | ''>('');
  const [currentAmps, setCurrentAmps] = useState<number | ''>('');
  const [voltage, setVoltage] = useState(120);
  const [phase, setPhase] = useState<1 | 3>(1);
  const [connectorType, setConnectorType] = useState(CONNECTOR_TYPES[0].value);
  const [customConnector, setCustomConnector] = useState('');
  const [isContinuousLoad, setIsContinuousLoad] = useState(true);
  const [source, setSource] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          category,
          powerWatts: specMode === 'watts' ? Number(powerWatts) : undefined,
          currentAmps: specMode === 'amps' ? Number(currentAmps) : undefined,
          voltage,
          phase,
          connectorType: connectorType === OTHER_CONNECTOR_VALUE ? customConnector : connectorType,
          isContinuousLoad,
          source: source || undefined,
        });
        setName('');
        setPowerWatts('');
        setCurrentAmps('');
        setSource('');
      }}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}
    >
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ width: 200 }} />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select value={specMode} onChange={(e) => setSpecMode(e.target.value as 'watts' | 'amps')}>
        <option value="watts">Watts</option>
        <option value="amps">Amps (motor/PSU)</option>
      </select>
      {specMode === 'watts' ? (
        <input
          required
          type="number"
          value={powerWatts}
          onChange={(e) => setPowerWatts(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="Watts"
          style={{ width: 90 }}
        />
      ) : (
        <input
          required
          type="number"
          value={currentAmps}
          onChange={(e) => setCurrentAmps(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="Amps"
          style={{ width: 90 }}
        />
      )}
      <input
        required
        type="number"
        value={voltage}
        onChange={(e) => setVoltage(Number(e.target.value))}
        placeholder="Voltage"
        style={{ width: 90 }}
      />
      <select value={phase} onChange={(e) => setPhase(Number(e.target.value) as 1 | 3)}>
        <option value={1}>1φ</option>
        <option value={3}>3φ</option>
      </select>
      <select value={connectorType} onChange={(e) => setConnectorType(e.target.value)}>
        {CONNECTOR_TYPES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
        <option value={OTHER_CONNECTOR_VALUE}>Other / custom…</option>
      </select>
      {connectorType === OTHER_CONNECTOR_VALUE && (
        <input
          required
          value={customConnector}
          onChange={(e) => setCustomConnector(e.target.value)}
          placeholder="Custom connector type"
          style={{ width: 140 }}
        />
      )}
      <label style={{ fontSize: 13 }}>
        <input type="checkbox" checked={isContinuousLoad} onChange={(e) => setIsContinuousLoad(e.target.checked)} />{' '}
        Continuous load
      </label>
      <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (optional)" style={{ width: 160 }} />
      <button type="submit">Add spec</button>
    </form>
  );
}

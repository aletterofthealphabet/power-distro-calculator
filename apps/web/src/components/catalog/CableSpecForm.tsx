import { useState } from 'react';
import type { CableSpec } from '@power-distro/shared-types';

export function CableSpecForm({ onSubmit }: { onSubmit: (spec: Partial<CableSpec>) => void }) {
  const [gaugeAwg, setGaugeAwg] = useState('12');
  const [conductorCount, setConductorCount] = useState(2);
  const [connectorType, setConnectorType] = useState('stage pin');
  const [ratedAmps, setRatedAmps] = useState(20);
  const [resistanceOhmsPer1000ft, setResistanceOhmsPer1000ft] = useState(1.93);
  const [source, setSource] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          gaugeAwg,
          conductorCount,
          connectorType,
          ratedAmps,
          resistanceOhmsPer1000ft,
          source: source || undefined,
        });
        setSource('');
      }}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}
    >
      <input required value={gaugeAwg} onChange={(e) => setGaugeAwg(e.target.value)} placeholder="Gauge (AWG)" style={{ width: 110 }} />
      <input
        required
        type="number"
        value={conductorCount}
        onChange={(e) => setConductorCount(Number(e.target.value))}
        placeholder="Conductors"
        style={{ width: 100 }}
      />
      <input
        required
        value={connectorType}
        onChange={(e) => setConnectorType(e.target.value)}
        placeholder="Connector type"
        style={{ width: 140 }}
      />
      <input
        required
        type="number"
        value={ratedAmps}
        onChange={(e) => setRatedAmps(Number(e.target.value))}
        placeholder="Rated amps"
        style={{ width: 100 }}
      />
      <input
        required
        type="number"
        step="0.001"
        value={resistanceOhmsPer1000ft}
        onChange={(e) => setResistanceOhmsPer1000ft(Number(e.target.value))}
        placeholder="Ω/1000ft"
        style={{ width: 100 }}
      />
      <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (optional)" style={{ width: 160 }} />
      <button type="submit">Add cable</button>
    </form>
  );
}

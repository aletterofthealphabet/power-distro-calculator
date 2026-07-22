import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/apiClient';
import { EquipmentSpecForm } from '../components/catalog/EquipmentSpecForm';
import { CableSpecForm } from '../components/catalog/CableSpecForm';

export function CatalogPage() {
  const [tab, setTab] = useState<'equipment' | 'cable'>('equipment');
  const equipmentSpecs = useApi(() => api.equipmentSpecs.list());
  const cableSpecs = useApi(() => api.cableSpecs.list());

  return (
    <div>
      <h1>Equipment & Cable Catalog</h1>
      <p style={{ opacity: 0.7 }}>Log new equipment and cable specs here so they're available in the plot builder.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('equipment')} disabled={tab === 'equipment'}>
          Equipment
        </button>
        <button onClick={() => setTab('cable')} disabled={tab === 'cable'}>
          Cable
        </button>
      </div>

      {tab === 'equipment' ? (
        <>
          <EquipmentSpecForm
            onSubmit={async (spec) => {
              await api.equipmentSpecs.create(spec);
              equipmentSpecs.reload();
            }}
          />
          {equipmentSpecs.loading && <p>Loading…</p>}
          {equipmentSpecs.error && <p style={{ color: 'red' }}>{equipmentSpecs.error}</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                <th>Name</th>
                <th>Category</th>
                <th>Load</th>
                <th>Voltage</th>
                <th>Phase</th>
                <th>Connector</th>
                <th>Continuous</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {equipmentSpecs.data?.map((spec) => (
                <tr key={spec.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>
                    {spec.name} {spec.unverified && <span title="Unverified source" style={{ opacity: 0.5 }}>⚠️</span>}
                  </td>
                  <td>{spec.category}</td>
                  <td>{spec.powerWatts != null ? `${spec.powerWatts}W` : `${spec.currentAmps}A`}</td>
                  <td>{spec.voltage}V</td>
                  <td>{spec.phase}φ</td>
                  <td>{spec.connectorType}</td>
                  <td>{spec.isContinuousLoad ? 'Yes' : 'No'}</td>
                  <td>
                    <button
                      onClick={async () => {
                        await api.equipmentSpecs.remove(spec.id);
                        equipmentSpecs.reload();
                      }}
                      style={{ color: '#b3261e' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <CableSpecForm
            onSubmit={async (spec) => {
              await api.cableSpecs.create(spec);
              cableSpecs.reload();
            }}
          />
          {cableSpecs.loading && <p>Loading…</p>}
          {cableSpecs.error && <p style={{ color: 'red' }}>{cableSpecs.error}</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                <th>Gauge</th>
                <th>Conductors</th>
                <th>Connector</th>
                <th>Rated amps</th>
                <th>Ω/1000ft</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cableSpecs.data?.map((spec) => (
                <tr key={spec.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>
                    {spec.gaugeAwg} AWG {spec.unverified && <span title="Unverified source" style={{ opacity: 0.5 }}>⚠️</span>}
                  </td>
                  <td>{spec.conductorCount}</td>
                  <td>{spec.connectorType}</td>
                  <td>{spec.ratedAmps}A</td>
                  <td>{spec.resistanceOhmsPer1000ft}</td>
                  <td>
                    <button
                      onClick={async () => {
                        await api.cableSpecs.remove(spec.id);
                        cableSpecs.reload();
                      }}
                      style={{ color: '#b3261e' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

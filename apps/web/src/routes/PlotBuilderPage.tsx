import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useLiveAnalysis } from '../hooks/useLiveAnalysis';
import { api } from '../lib/apiClient';
import { buildPlotInput } from '../lib/buildPlotInput';
import { DistroUnitCard } from '../components/plot/DistroUnitCard';
import { ViolationList } from '../components/violations/ViolationList';
import type { Circuit, DistroUnit } from '@power-distro/shared-types';
import type { InstanceChip } from '../components/plot/EquipmentInstanceDrop';

export function PlotBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const plot = useApi(() => api.plots.get(id!), [id]);
  const equipmentSpecs = useApi(() => api.equipmentSpecs.list());
  const cableSpecs = useApi(() => api.cableSpecs.list());

  const [showAddDistro, setShowAddDistro] = useState(false);
  const [distroName, setDistroName] = useState('');
  const [inputConnector, setInputConnector] = useState('camlock 400A');
  const [maxAmps, setMaxAmps] = useState(200);
  const [phaseConfig, setPhaseConfig] = useState<1 | 3>(3);
  const [voltage, setVoltage] = useState(208);
  const [selectedSpecId, setSelectedSpecId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const specsById = useMemo(
    () => new Map((equipmentSpecs.data ?? []).map((s) => [s.id, s])),
    [equipmentSpecs.data],
  );
  const cableSpecsById = useMemo(
    () => new Map((cableSpecs.data ?? []).map((s) => [s.id, s])),
    [cableSpecs.data],
  );

  const plotInput = useMemo(() => {
    if (!plot.data) return null;
    return buildPlotInput(plot.data, specsById, cableSpecsById);
  }, [plot.data, specsById, cableSpecsById]);

  const report = useLiveAnalysis(plotInput);

  const circuitResultsById = useMemo(
    () => new Map(report.circuits.map((c) => [c.circuitId, c])),
    [report.circuits],
  );

  const instancesByCircuit = useMemo(() => {
    const map = new Map<string, InstanceChip[]>();
    for (const instance of plot.data?.instances ?? []) {
      if (!instance.circuitId) continue;
      const chip: InstanceChip = { instance, spec: specsById.get(instance.equipmentSpecId) };
      map.set(instance.circuitId, [...(map.get(instance.circuitId) ?? []), chip]);
    }
    return map;
  }, [plot.data?.instances, specsById]);

  const unassignedInstances: InstanceChip[] = useMemo(
    () =>
      (plot.data?.instances ?? [])
        .filter((i) => !i.circuitId)
        .map((instance) => ({ instance, spec: specsById.get(instance.equipmentSpecId) })),
    [plot.data?.instances, specsById],
  );

  if (plot.loading) return <p>Loading plot…</p>;
  if (plot.error) return <p style={{ color: 'red' }}>{plot.error}</p>;
  if (!plot.data) return null;

  const distroUnits = plot.data.distroUnits as (DistroUnit & { circuits: Circuit[] })[];

  return (
    <div>
      <h1>{plot.data.name}</h1>
      <p>
        <Link to={`/plots/${id}/analysis`}>Go to server-verified analysis & auto-balance →</Link>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: 20 }}>
        <div>
          <h3>Unassigned equipment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {unassignedInstances.length === 0 && <p style={{ opacity: 0.5, fontSize: 13 }}>Nothing unassigned.</p>}
            {unassignedInstances.map(({ instance, spec }) => (
              <div
                key={instance.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/instance-id', instance.id)}
                style={{
                  background: '#e5e7eb',
                  borderRadius: 4,
                  padding: '6px 8px',
                  fontSize: 13,
                  cursor: 'grab',
                }}
              >
                {spec?.name ?? 'Unknown spec'} ×{instance.quantity}
                <button
                  onClick={async () => {
                    await api.equipmentInstances.remove(instance.id);
                    plot.reload();
                  }}
                  style={{ marginLeft: 6, border: 'none', background: 'none', color: '#b3261e', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <h4>Add equipment</h4>
          <select value={selectedSpecId} onChange={(e) => setSelectedSpecId(e.target.value)} style={{ width: '100%', marginBottom: 6 }}>
            <option value="">Select spec…</option>
            {equipmentSpecs.data?.map((spec) => (
              <option key={spec.id} value={spec.id}>
                {spec.name}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={{ width: 70 }}
            />
            <button
              disabled={!selectedSpecId}
              onClick={async () => {
                await api.equipmentInstances.create(plot.data!.id, { equipmentSpecId: selectedSpecId, quantity });
                setSelectedSpecId('');
                setQuantity(1);
                plot.reload();
              }}
            >
              Add to plot
            </button>
          </div>
        </div>

        <div>
          <h3>Distros</h3>
          {distroUnits.map((distro) => {
            const legs = report.balance.legs.filter((l) => l.distroUnitId === distro.id);
            return (
              <DistroUnitCard
                key={distro.id}
                distro={distro}
                circuits={distro.circuits}
                circuitResults={circuitResultsById}
                legs={legs}
                instancesByCircuit={instancesByCircuit}
                onAddCircuit={async (distroId, body) => {
                  await api.circuits.create(distroId, body);
                  plot.reload();
                }}
                onDeleteCircuit={async (circuitId) => {
                  await api.circuits.remove(circuitId);
                  plot.reload();
                }}
                onDeleteDistro={async (distroId) => {
                  await api.distroUnits.remove(distroId);
                  plot.reload();
                }}
                onDropInstance={async (instanceId, circuitId) => {
                  await api.equipmentInstances.update(instanceId, { circuitId });
                  plot.reload();
                }}
                onTogglePin={async (instanceId, pinned) => {
                  await api.equipmentInstances.update(instanceId, { pinned });
                  plot.reload();
                }}
                onRemoveInstance={async (instanceId) => {
                  await api.equipmentInstances.update(instanceId, { circuitId: null });
                  plot.reload();
                }}
              />
            );
          })}

          {showAddDistro ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await api.distroUnits.create(plot.data!.id, { name: distroName, inputConnector, maxAmps, phaseConfig, voltage });
                setDistroName('');
                setShowAddDistro(false);
                plot.reload();
              }}
              style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}
            >
              <input required value={distroName} onChange={(e) => setDistroName(e.target.value)} placeholder="Distro name" style={{ width: 160 }} />
              <input value={inputConnector} onChange={(e) => setInputConnector(e.target.value)} placeholder="Input connector" style={{ width: 140 }} />
              <input type="number" value={maxAmps} onChange={(e) => setMaxAmps(Number(e.target.value))} placeholder="Max amps" style={{ width: 90 }} />
              <select value={phaseConfig} onChange={(e) => setPhaseConfig(Number(e.target.value) as 1 | 3)}>
                <option value={1}>1φ</option>
                <option value={3}>3φ</option>
              </select>
              <input type="number" value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} placeholder="Voltage" style={{ width: 90 }} />
              <button type="submit">Add</button>
              <button type="button" onClick={() => setShowAddDistro(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button onClick={() => setShowAddDistro(true)}>+ Add distro</button>
          )}
        </div>

        <div>
          <h3>Live analysis</h3>
          <p style={{ fontSize: 13, opacity: 0.7 }}>Computed client-side on every change — the server re-checks on save.</p>
          <p>Total draw: {report.totalDrawAmps.toFixed(1)}A</p>
          <ViolationList violations={report.violations} />
        </div>
      </div>
    </div>
  );
}

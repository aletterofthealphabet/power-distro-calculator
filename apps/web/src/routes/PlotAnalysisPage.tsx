import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AnalysisReport, BalanceProposal, PhaseLegResult } from '@power-distro/calc-engine';
import { api } from '../lib/apiClient';
import { ViolationList } from '../components/violations/ViolationList';
import { PhaseBalanceBar } from '../components/plot/PhaseBalanceBar';

export function PlotAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [proposal, setProposal] = useState<BalanceProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  async function runAnalyze() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await api.analysis.analyze(id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runAutoBalance() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setProposal(await api.analysis.autoBalance(id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function applyProposal() {
    if (!id || !proposal) return;
    setApplying(true);
    try {
      // One-way data flow: nothing was written when the proposal was
      // computed (DESIGN.md §1.1) — applying is a normal PATCH per
      // affected instance, confirmed explicitly by the user here.
      for (const p of proposal.proposed) {
        await api.equipmentInstances.update(p.instanceId, { circuitId: p.toCircuitId });
      }
      setProposal(null);
      await runAnalyze();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setApplying(false);
    }
  }

  const legsByDistro = new Map<string, PhaseLegResult[]>();
  if (report) {
    for (const leg of report.balance.legs) {
      legsByDistro.set(leg.distroUnitId, [...(legsByDistro.get(leg.distroUnitId) ?? []), leg]);
    }
  }

  return (
    <div>
      <p>
        <Link to={`/plots/${id}`}>← Back to plot builder</Link>
      </p>
      <h1>Server-verified analysis</h1>
      <p style={{ opacity: 0.7 }}>
        Runs the same calc-engine server-side against the saved plot — the source of truth (DESIGN.md §1.1).
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={runAnalyze} disabled={loading}>
          {loading ? 'Running…' : 'Run analysis'}
        </button>
        <button onClick={runAutoBalance} disabled={loading}>
          {loading ? 'Running…' : 'Auto-balance (propose)'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {report && (
        <div style={{ marginBottom: 24 }}>
          <h3>Total draw: {report.totalDrawAmps.toFixed(1)}A</h3>
          <p>Overall phase deviation: {report.balance.deviationPct.toFixed(1)}%</p>
          {[...legsByDistro.entries()].map(([distroId, legs]) => (
            <div key={distroId} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Distro {distroId.slice(0, 8)}</div>
              <PhaseBalanceBar legs={legs} deviationPct={report.balance.deviationPct} />
            </div>
          ))}
          <h3>Violations</h3>
          <ViolationList violations={report.violations} />
        </div>
      )}

      {proposal && (
        <div style={{ border: '1px solid #3b82f6', borderRadius: 8, padding: 14 }}>
          <h3>Proposed rebalance ({proposal.proposed.length} reassignment(s))</h3>
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            Nothing has been applied yet. Review, then apply — pinned items are never included here.
          </p>
          <ul>
            {proposal.proposed.map((p, i) => (
              <li key={i} style={{ fontSize: 13, fontFamily: 'monospace' }}>
                instance {p.instanceId.slice(0, 8)}: {p.fromCircuitId?.slice(0, 8) ?? '(unassigned)'} → {p.toCircuitId.slice(0, 8)}
              </li>
            ))}
          </ul>
          <p>Projected deviation: {proposal.projectedBalance.deviationPct.toFixed(1)}%</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={applyProposal} disabled={applying || proposal.proposed.length === 0}>
              {applying ? 'Applying…' : 'Apply'}
            </button>
            <button onClick={() => setProposal(null)} disabled={applying}>
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

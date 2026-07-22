import type { PhaseLegResult } from '@power-distro/calc-engine';

export function PhaseBalanceBar({ legs, deviationPct }: { legs: PhaseLegResult[]; deviationPct: number }) {
  if (legs.length === 0) {
    return <p style={{ opacity: 0.6 }}>No circuits to balance yet.</p>;
  }

  const max = Math.max(...legs.map((l) => l.totalAmps), 1);
  const deviationColor = deviationPct > 20 ? '#b3261e' : deviationPct > 10 ? '#9a5b00' : '#1e7e34';

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {legs.map((leg) => (
          <div key={`${leg.distroUnitId}-${leg.leg}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 36, fontFamily: 'monospace' }}>{leg.leg}</span>
            <div style={{ flex: 1, background: '#eee', borderRadius: 4, overflow: 'hidden', height: 16 }}>
              <div
                style={{
                  width: `${(leg.totalAmps / max) * 100}%`,
                  background: '#3b82f6',
                  height: '100%',
                }}
              />
            </div>
            <span style={{ width: 70, fontFamily: 'monospace', textAlign: 'right' }}>
              {leg.totalAmps.toFixed(1)}A
            </span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 8, color: deviationColor, fontSize: 14 }}>
        Deviation: {deviationPct.toFixed(1)}%
      </p>
    </div>
  );
}

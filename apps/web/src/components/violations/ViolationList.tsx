import type { Violation } from '@power-distro/calc-engine';

const SEVERITY_STYLE: Record<Violation['severity'], { bg: string; fg: string; label: string }> = {
  violation: { bg: '#fdecea', fg: '#b3261e', label: 'Violation' },
  warning: { bg: '#fff4e5', fg: '#9a5b00', label: 'Warning' },
  ok: { bg: '#e8f5e9', fg: '#1e7e34', label: 'OK' },
};

export function ViolationList({ violations }: { violations: Violation[] }) {
  if (violations.length === 0) {
    return <p style={{ color: '#1e7e34' }}>No violations — plot looks safe.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {violations.map((v, i) => {
        const style = SEVERITY_STYLE[v.severity];
        return (
          <li
            key={i}
            style={{
              background: style.bg,
              color: style.fg,
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 14,
            }}
          >
            <strong>{style.label}</strong> · {v.checkId}
            {v.circuitId ? ` · circuit ${v.circuitId.slice(0, 8)}` : ''}
            {v.distroUnitId ? ` · distro ${v.distroUnitId.slice(0, 8)}` : ''}
            <div>{v.message}</div>
            {v.necReference && <div style={{ opacity: 0.7 }}>Ref: {v.necReference}</div>}
          </li>
        );
      })}
    </ul>
  );
}

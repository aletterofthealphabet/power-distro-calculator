import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/apiClient';

export function PlotListPage() {
  const plots = useApi(() => api.plots.list());
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');

  return (
    <div>
      <h1>Plots</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name) return;
          await api.plots.create({ name, venue: venue || undefined });
          setName('');
          setVenue('');
          plots.reload();
        }}
        style={{ display: 'flex', gap: 8, marginBottom: 16 }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Show name" required style={{ width: 220 }} />
        <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue (optional)" style={{ width: 220 }} />
        <button type="submit">Create plot</button>
      </form>

      {plots.loading && <p>Loading…</p>}
      {plots.error && <p style={{ color: 'red' }}>{plots.error}</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {plots.data?.map((plot) => (
          <li
            key={plot.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <Link to={`/plots/${plot.id}`} style={{ fontWeight: 600 }}>
                {plot.name}
              </Link>
              {plot.venue && <span style={{ opacity: 0.6 }}> · {plot.venue}</span>}
            </div>
            <button
              onClick={async () => {
                await api.plots.remove(plot.id);
                plots.reload();
              }}
              style={{ color: '#b3261e' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

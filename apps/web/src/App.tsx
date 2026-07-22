import { NavLink, Route, Routes } from 'react-router-dom';
import { CatalogPage } from './routes/CatalogPage';
import { PlotListPage } from './routes/PlotListPage';
import { PlotBuilderPage } from './routes/PlotBuilderPage';
import { PlotAnalysisPage } from './routes/PlotAnalysisPage';

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  marginRight: 16,
  fontWeight: isActive ? 700 : 400,
  textDecoration: 'none',
  color: isActive ? '#111827' : '#4b5563',
});

export function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <nav style={{ marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
        <NavLink to="/" end style={navLinkStyle}>
          Plots
        </NavLink>
        <NavLink to="/catalog" style={navLinkStyle}>
          Catalog
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<PlotListPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/plots/:id" element={<PlotBuilderPage />} />
        <Route path="/plots/:id/analysis" element={<PlotAnalysisPage />} />
      </Routes>
    </div>
  );
}

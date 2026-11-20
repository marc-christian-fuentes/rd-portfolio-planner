/**
 * ROUTES
 * ------
 * Connects each web address to a page. A page the current role may not
 * see sends you to that role's home page instead.
 */
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import PortfolioPage from './pages/PortfolioPage';
import AdminPage from './pages/AdminPage';
import PlaceholderPage from './pages/PlaceholderPage';
import { canSee, homePath, type SectionId } from './data/access';
import { useApp } from './store';

function Guard({ section, children }: { section: SectionId; children: ReactNode }) {
  const role = useApp((s) => s.role);
  return canSee(role, section) ? children : <Navigate to={homePath(role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Guard section="portfolio"><PortfolioPage /></Guard>} />
          <Route path="/resourcing" element={<Guard section="resourcing"><PlaceholderPage section="resourcing" /></Guard>} />
          <Route path="/capacity" element={<Guard section="capacity"><PlaceholderPage section="capacity" /></Guard>} />
          <Route path="/sales" element={<Guard section="sales"><PlaceholderPage section="sales" /></Guard>} />
          <Route path="/planning" element={<Guard section="planning"><PlaceholderPage section="planning" /></Guard>} />
          <Route path="/manufacturing" element={<Guard section="manufacturing"><PlaceholderPage section="manufacturing" /></Guard>} />
          <Route path="/assumptions" element={<Guard section="assumptions"><PlaceholderPage section="assumptions" /></Guard>} />
          <Route path="/admin" element={<Guard section="admin"><AdminPage /></Guard>} />
          <Route path="/inbox" element={<Guard section="inbox"><PlaceholderPage section="inbox" /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

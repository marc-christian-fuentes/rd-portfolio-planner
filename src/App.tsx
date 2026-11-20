/**
 * ROUTES
 * ------
 * Connects each web address to a page. A page the current role may not
 * see sends you to that role's home page instead.
 */
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import SummaryPage from './pages/SummaryPage';
import PlatformPage from './pages/PlatformPage';
import RoiPage from './pages/RoiPage';
import ForecastPage from './pages/ForecastPage';
import RoadmapPage from './pages/RoadmapPage';
import ResourcingPage from './pages/ResourcingPage';
import CapacityPage from './pages/CapacityPage';
import SalesPage from './pages/SalesPage';
import AdminPage from './pages/AdminPage';
import PlaceholderPage from './pages/PlaceholderPage';
import { canSee, homePath, type SectionId } from './data/access';
import { useApp } from './store';

function Guard({ section, children }: { section: SectionId; children: ReactNode }) {
  const role = useApp((s) => s.role);
  return canSee(role, section) ? children : <Navigate to={homePath(role)} replace />;
}

const page = (section: SectionId, element: ReactNode) => <Guard section={section}>{element}</Guard>;
const placeholder = (section: SectionId) => page(section, <PlaceholderPage section={section} />);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/inbox" element={placeholder('inbox')} />

          {/* Portfolio */}
          <Route path="/" element={page('summary', <SummaryPage />)} />
          <Route path="/platform" element={page('platform', <PlatformPage />)} />
          <Route path="/platform/:platformId" element={page('platform', <PlatformPage />)} />
          <Route path="/project" element={page('project', <RoiPage />)} />
          <Route path="/project/:projectId" element={page('project', <RoiPage />)} />
          <Route path="/roi/*" element={<Navigate to="/project" replace />} />

          <Route path="/forecast" element={page('forecast', <ForecastPage />)} />
          <Route path="/roadmap" element={page('roadmap', <RoadmapPage />)} />

          {/* Quarterly planning */}
          <Route path="/planning" element={<Navigate to="/planning/submit" replace />} />
          <Route path="/planning/submit" element={placeholder('submission')} />
          <Route path="/planning/prioritise" element={placeholder('prioritisation')} />

          <Route path="/manufacturing" element={placeholder('manufacturing')} />

          {/* Project management */}
          <Route path="/resourcing" element={page('resourcing', <ResourcingPage />)} />
          <Route path="/capacity" element={page('capacity', <CapacityPage />)} />

          <Route path="/sales" element={page('sales', <SalesPage />)} />
          <Route path="/assumptions" element={placeholder('assumptions')} />
          <Route path="/admin" element={page('admin', <AdminPage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

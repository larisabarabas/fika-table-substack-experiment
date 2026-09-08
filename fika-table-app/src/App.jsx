import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/global.css';

const Welcome = lazy(() => import('./pages/Welcome'));
const Table   = lazy(() => import('./pages/Table'));
const Share   = lazy(() => import('./pages/Share'));
const Privacy = lazy(() => import('./pages/Privacy'));

// Analytics/SpeedInsights don't gate interactivity — lazy-load them into their
// own chunk so they never share the initial bundle with the app itself.
const Analytics     = lazy(() => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights })));

// /cake is the old route — redirect old links to /table, preserving ?give=1 etc.
function CakeRedirect() {
  const location = useLocation();
  return <Navigate to={`/table${location.search}`} replace />;
}

// Shown while a route's own code chunk is still downloading — the moment
// before that page exists to render its own loading state.
function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="page-loader-spinner" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div id="confetti-layer" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"        element={<Welcome />} />
          <Route path="/table"   element={<Table />} />
          <Route path="/cake"    element={<CakeRedirect />} />
          <Route path="/share/:id" element={<Share />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Suspense fallback={null}>
        <Analytics />
        <SpeedInsights />
      </Suspense>
    </BrowserRouter>
  );
}

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"


const Welcome = lazy(() => import('./pages/Welcome'));
const Cake    = lazy(() => import('./pages/Cake'));
const Share   = lazy(() => import('./pages/Share'));
const Privacy = lazy(() => import('./pages/Privacy'));

export default function App() {
  return (
    <BrowserRouter>
      <div id="confetti-layer" />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/"        element={<Welcome />} />
          <Route path="/cake"    element={<Cake />} />
          <Route path="/share/:id" element={<Share />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
       <Analytics />
       <SpeedInsights />
    </BrowserRouter>
  );
}

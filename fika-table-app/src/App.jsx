import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';

const Welcome = lazy(() => import('./pages/Welcome'));
const Cake    = lazy(() => import('./pages/Cake'));

export default function App() {
  return (
    <BrowserRouter>
      <div id="confetti-layer" />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/"     element={<Welcome />} />
          <Route path="/cake" element={<Cake />} />
          <Route path="*"     element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

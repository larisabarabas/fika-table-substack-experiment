import { lazy, Suspense } from 'react';

const BdcRound  = lazy(() => import('./BdcRound'));
const BdcTiered = lazy(() => import('./BdcTiered'));
const BdcCards  = lazy(() => import('./BdcCards'));

export function SlicePicker({ mode, ...props }) {
  let Treatment;
  if (mode === 'tiered') Treatment = BdcTiered;
  else if (mode === 'cards') Treatment = BdcCards;
  else Treatment = BdcRound;

  return (
    <Suspense fallback={<div style={{ height: 400 }} />}>
      <Treatment {...props} />
    </Suspense>
  );
}

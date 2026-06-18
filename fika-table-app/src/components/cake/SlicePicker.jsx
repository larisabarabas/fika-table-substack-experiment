import { lazy, Suspense } from 'react';
import CakeRound from './CakeRound';

const SliceCards = lazy(() => import('./SliceCards'));

export function SlicePicker({ mode, ...props }) {
  if (mode === 'cards') {
    return (
      <Suspense fallback={<div style={{ height: 400 }} />}>
        <SliceCards {...props} />
      </Suspense>
    );
  }
  return <CakeRound {...props} />;
}

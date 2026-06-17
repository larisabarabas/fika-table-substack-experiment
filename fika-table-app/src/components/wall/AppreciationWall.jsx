import { useTransition } from 'react';
import WallCard from './WallCard';
import { CONFIG } from '../../config';
import styles from './wall.module.css';

const FILTERS = [
  { k: 'all',    label: 'Everyone' },
  { k: 'host',   label: `For ${CONFIG.hostName}` },
  { k: 'passed', label: 'Passed around' },
];

export function AppreciationWall({ slices, filter, onFilter, onRead }) {
  const [, startTransition] = useTransition();

  // Filter + sort in one pass, then toSorted for immutability (rules 7.6, 7.12)
  const visible = slices
    .filter((s) => {
      if (filter === 'all')    return true;
      if (filter === 'host')   return s.toType === 'host';
      return s.toType !== 'host';
    })
    .toSorted((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt) || (a.idx ?? Infinity) - (b.idx ?? Infinity)
    );

  return (
    <section className={styles.wall}>
      <div className={styles.wallHead}>
        <h2 className={styles.wallTitle}>The appreciation table</h2>
        <p className={styles.wallLede}>Every slice that's been cut, and every kind word it cost.</p>
      </div>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.k}
            aria-pressed={filter === f.k}
            className={`${styles.chip} ${filter === f.k ? styles.chipOn : ''}`}
            onClick={() => startTransition(() => onFilter(f.k))}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>No slices here yet. Be the first to leave one.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((s) => (
            <WallCard key={s.id} slice={s} onClick={() => onRead(s)} />
          ))}
        </div>
      )}
    </section>
  );
}

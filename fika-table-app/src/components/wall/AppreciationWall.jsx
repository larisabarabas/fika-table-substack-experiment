import { useState, useTransition, useMemo } from 'react';
import WallCard from './WallCard';
import { useMasonryColumns } from '../../hooks/useMasonryColumns';
import styles from './wall.module.css';

const FILTERS = [
  { k: 'all',    label: 'Everyone' },
  { k: 'passed', label: 'Passed to someone' },
  { k: 'table',  label: 'Left on the table' },
];

const stripAt = (s) => s.replace(/^@+/, '').toLowerCase();

export function AppreciationWall({ slices, filter, onFilter, onRead, initialSearch }) {
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch ?? '');

  const searchTerm = stripAt(search.trim());

  const visible = useMemo(() =>
    slices
      .filter((s) => {
        if (filter === 'passed' && s.toType === 'anyone') return false;
        if (filter === 'table'  && s.toType !== 'anyone') return false;
        if (searchTerm) return stripAt(s.toName ?? '').includes(searchTerm);
        return true;
      })
      .toSorted((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt) || (a.idx ?? Infinity) - (b.idx ?? Infinity)
      ),
    [slices, filter, searchTerm]
  );

  const emptyMessage = searchTerm
    ? `No slices for @${searchTerm} yet.`
    : filter === 'all'
      ? 'No slices here yet. Be the first to take one.'
      : 'No slices match this filter yet.';

  const { containerRef, columns } = useMasonryColumns(visible);

  return (
    <section className={styles.wall}>
      <div className={styles.wallHead}>
        <h2 className={styles.wallTitle}>The appreciation table</h2>
        <p className={styles.wallLede}>Every slice that's been taken, and the kind word it cost.</p>
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
        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by @handle"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search slices by handle"
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">✕</button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <div className={styles.grid} ref={containerRef}>
          {columns.map((column, i) => (
            <div className={styles.gridColumn} key={i}>
              {column.map((s) => (
                <WallCard key={s.id} slice={s} onRead={onRead} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

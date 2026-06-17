import { useState, useEffect, useRef, useTransition } from 'react';
import { useSlices } from '../hooks/useSlices';
import { CONFIG } from '../config';
import { fireConfetti } from '../lib/confetti';
import { SlicePicker } from '../components/cake/SlicePicker';
import { AppreciationWall } from '../components/wall/AppreciationWall';
import { ReadModal } from '../components/modals/ReadModal';
import { GiveModal } from '../components/modals/GiveModal';
import styles from './Cake.module.css';

const MODES = [
  { k: 'round',  label: 'Round cake' },
  { k: 'tiered', label: 'Tiered & candles' },
  { k: 'cards',  label: 'Slice cards' },
];

export default function Cake() {
  const { slices, filled, sharedCount, isFull, loading, insertSlice, nextFreeIdx } = useSlices();
  const [mode,    setMode]    = useState('round');
  const [filter,  setFilter]  = useState('all');
  const [reading, setReading] = useState(null);
  const [giving,  setGiving]  = useState(null); // { idx: number|null } | null
  const [, startTransition]   = useTransition();
  const giveHandled           = useRef(false);

  // Handle ?give=1 from Welcome — run once after initial load
  useEffect(() => {
    if (loading || giveHandled.current) return;
    giveHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('give')) return;
    window.history.replaceState({}, '', window.location.pathname);
    if (isFull) setGiving({ idx: null });
    else {
      const free = nextFreeIdx();
      if (free !== null) setGiving({ idx: free });
    }
  }, [loading, isFull, nextFreeIdx]);

  const onSlice = (idx) => {
    if (filled[idx]) setReading(filled[idx]);
    else setGiving({ idx });
  };

  const openGive = () => {
    if (isFull) setGiving({ idx: null });
    else {
      const free = nextFreeIdx();
      if (free !== null) setGiving({ idx: free });
    }
  };

  const handleGive = async (data) => {
    const result = await insertSlice(data);
    if (result?.error === 'conflict') {
      // Slice was just taken — move to next free
      const free = nextFreeIdx();
      setGiving(free !== null ? { idx: free } : { idx: null });
      return;
    }
    if (!result?.error) {
      setGiving(null);
      setTimeout(fireConfetti, 60);
    }
  };

  const count = CONFIG.sliceCapacity;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          <span className={styles.brandName}>{CONFIG.newsletter}</span>
        </div>
        <div className={styles.headRight}>
          <span className={styles.progress}>
            <b>{sharedCount}</b> / {count} slices cut
          </span>
          <button className="btn-solid btn-solid-sm" onClick={openGive}>
            {isFull ? 'Leave a note' : 'Cut a slice'}
          </button>
        </div>
      </header>

      <main className={styles.container}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="eyebrow">— A birthday, shared —</div>
          <h1 className={styles.headline}>
            <span>{CONFIG.cakeHeadline[0]}</span>
            <em>{CONFIG.cakeHeadline[1]}</em>
          </h1>
          <p className={styles.subhead}>{CONFIG.cakeSubhead}</p>
          <div className="date-pill">{CONFIG.dateRange}</div>
        </section>

        {/* Mode tabs */}
        <div className={styles.tabs} role="tablist" aria-label="Cake view">
          {MODES.map((m) => (
            <button
              key={m.k}
              role="tab"
              aria-selected={mode === m.k}
              className={`${styles.tab} ${mode === m.k ? styles.tabOn : ''}`}
              onClick={() => startTransition(() => setMode(m.k))}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Cake */}
        <section className={styles.stage}>
          {loading ? (
            <div className={styles.loadingPlate} />
          ) : (
            <SlicePicker
              mode={mode}
              count={count}
              filled={filled}
              sharedCount={sharedCount}
              onSlice={onSlice}
            />
          )}
        </section>

        {/* Full banner */}
        {isFull && (
          <div className={styles.fullBanner}>
            Every slice has been cut — the whole cake is gone. 🕯️ But the table's still open.
          </div>
        )}

        {/* Wall */}
        <AppreciationWall
          slices={slices}
          filter={filter}
          onFilter={setFilter}
          onRead={setReading}
        />
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerScript}>with love, {CONFIG.hostName}</span>
        <span className={styles.footerSub}>{CONFIG.footerSub}</span>
      </footer>

      {/* Modals */}
      {reading && (
        <ReadModal slice={reading} onClose={() => setReading(null)} />
      )}
      {giving !== null && (
        <GiveModal
          idx={giving.idx}
          onClose={() => setGiving(null)}
          onGive={handleGive}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSlices } from '../hooks/useSlices';
import { CONFIG } from '../config';
import { fireConfetti } from '../lib/confetti';
import { SlicePicker } from '../components/cake/SlicePicker';
import { AppreciationWall } from '../components/wall/AppreciationWall';
import { ReadModal } from '../components/modals/ReadModal';
import { GiveModal } from '../components/modals/GiveModal';
import styles from './Cake.module.css';

const MODES = [
  { k: 'round', label: 'Round cake' },
  { k: 'cards', label: 'Slice cards' },
];

export default function Cake() {
  const { slices, filled, sharedCount, isFull, loading, error, insertSlice, nextFreeIdx, roundSize } = useSlices();
  const [mode,        setMode]        = useState('round');
  const [filter,      setFilter]      = useState('all');
  const [reading,     setReading]     = useState(null);
  const [giving,      setGiving]      = useState(null);
  const [, startTransition]   = useTransition();
  const giveHandled           = useRef(false);

  const mentions = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mentions') ?? '';
  }, []);

  const wallRef = useRef(null);

  // Handle ?mentions=@handle — scroll to wall once loaded
  useEffect(() => {
    if (loading || error || !mentions) return;
    wallRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [mentions, loading, error]);

  // Handle ?give=1 from Welcome — run once after initial load
  useEffect(() => {
    if (loading || error || giveHandled.current) return;
    giveHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('give')) return;
    window.history.replaceState({}, '', window.location.pathname);
    if (!isFull) {
      const free = nextFreeIdx();
      if (free !== null) startTransition(() => setGiving({ idx: free }));
    }
  }, [loading, error, isFull, nextFreeIdx]);

  const onSlice = (idx) => {
    if (filled[idx]) setReading(filled[idx]);
    else setGiving({ idx });
  };

  const openGive = () => {
    if (isFull) return;
    const free = nextFreeIdx();
    if (free !== null) setGiving({ idx: free });
  };

  const handleGive = async (data) => {
    const result = await insertSlice(data);
    if (result?.error === 'conflict') {
      const free = nextFreeIdx();
      if (free !== null) setGiving({ idx: free });
      return result;
    }
    if (!result?.error && result?.data) {
      setGiving(null);
      setReading(result.data);
      setTimeout(fireConfetti, 60);
    }
    return result;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <Link to="/" className={styles.brandTop}>Substack FIKA</Link>
          <span className={styles.brandBottom}>
            for{' '}
            <a href={CONFIG.substackUrl} target="_blank" rel="noopener noreferrer" className={styles.brandSubLink}>
              {CONFIG.newsletter}
            </a>
          </span>
        </div>
        <div className={styles.headRight}>
          <span className={styles.progress}>
            <b>{sharedCount}</b> / {roundSize} this week
          </span>
          <button className="btn-solid btn-solid-sm" onClick={openGive} disabled={isFull}>
            {CONFIG.cakeCTA}
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          Could not load the table — {error.message ?? 'please refresh and try again.'}
        </div>
      )}

      <main className={styles.container}>
        {/* Hero */}
        <section className={styles.hero}>
          <p className="eyebrow">{CONFIG.cakeEyebrow}</p>
          <h1 className={styles.headline}>
            <span>{CONFIG.cakeHeadline[0]}</span>
            <em>{CONFIG.cakeHeadline[1]}</em>
          </h1>
          <p className={styles.subhead}>{CONFIG.cakeSubhead}</p>
          <p className={styles.ruleLine}>{CONFIG.welcomeRule}</p>
          <div className="tagline-pill">{CONFIG.dateRange}</div>
        </section>

        {/* Mode tabs */}
        <div className={styles.tabs} aria-label="Cake view">
          {MODES.map((m) => (
            <button
              key={m.k}
              aria-pressed={mode === m.k}
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
            <div className={styles.loadingPlate} role="status" aria-label="Loading" />
          ) : (
            <SlicePicker
              mode={mode}
              count={roundSize}
              filled={filled}
              sharedCount={sharedCount}
              onSlice={onSlice}
            />
          )}
        </section>

        {/* Scroll cue */}
        <div className={styles.scrollCue} aria-hidden="true">
          <span className={styles.scrollCueLine} />
          <span className={styles.scrollCueArrow}>↓</span>
        </div>

        {/* Full banner */}
        {!error && isFull && (
          <div className={styles.fullBanner} role="status">
            <span>This week's cake is all gone — every slice taken. Check back next week!</span>
          </div>
        )}

        {/* Wall */}
        {!error && (
          <div ref={wallRef}>
            <AppreciationWall
              slices={slices}
              filter={filter}
              onFilter={setFilter}
              onRead={setReading}
              initialSearch={mentions}
            />
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerScript}>{CONFIG.footerScript}</p>
        <p className={styles.footerSub}>{CONFIG.footerSub}</p>
        <p className={styles.footerPriv}><Link to="/privacy">Privacy</Link></p>
      </footer>

      {/* Modals */}
      {reading ? (
        <ReadModal slice={reading} onClose={() => setReading(null)} />
      ) : null}
      {giving !== null ? (
        <GiveModal
          idx={giving.idx}
          onClose={() => setGiving(null)}
          onGive={handleGive}
        />
      ) : null}
    </div>
  );
}

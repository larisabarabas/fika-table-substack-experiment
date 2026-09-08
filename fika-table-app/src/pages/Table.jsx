import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSlices } from '../hooks/useSlices';
import { CONFIG } from '../config';
import { fireConfetti } from '../lib/confetti';
import CakeRound from '../components/cake/CakeRound';
import { Footer } from '../components/Footer';
import { AppreciationWall } from '../components/wall/AppreciationWall';
import { ReadModal } from '../components/modals/ReadModal';
import { GiveModal } from '../components/modals/GiveModal';
import styles from './Table.module.css';

export default function Table() {
  const { slices, filled, sharedCount, isFull, loading, error, insertSlice, nextFreeIdx, roundSize } = useSlices();
  const [filter,      setFilter]      = useState('all');
  const [reading,     setReading]     = useState(null);
  const [giving,      setGiving]      = useState(null);
  const [, startTransition]   = useTransition();
  const giveHandled           = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mentions] = useState(() => searchParams.get('mentions') ?? '');

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
    if (!searchParams.has('give')) return;
    setSearchParams({}, { replace: true });
    if (!isFull) {
      const free = nextFreeIdx();
      if (free !== null) startTransition(() => setGiving({ idx: free }));
    }
  }, [loading, error, isFull, nextFreeIdx, searchParams, setSearchParams]);

  const openGive = useCallback(() => {
    if (isFull) return;
    const free = nextFreeIdx();
    if (free !== null) setGiving({ idx: free });
  }, [isFull, nextFreeIdx]);

  const handleGive = useCallback(async (data) => {
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
  }, [insertSlice, nextFreeIdx]);

  const slicesLeft = Math.max(roundSize - sharedCount, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.logoLink} aria-label="Fika — back to the welcome page">
          <img src="/illustrations/Fika_logo_text.svg" alt="Fika" className={styles.logo} />
        </Link>
        <p className={styles.subline}>{CONFIG.tableSubline}</p>
        <div className={styles.headRight}>
          <span className={styles.progress}>
            <b>{sharedCount}</b> / {roundSize} this week
          </span>
          <button className="btn-solid btn-solid-sm" onClick={openGive} disabled={isFull}>
            {isFull ? 'All slices taken' : CONFIG.tableCTA}
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          Could not load the table — please refresh and try again.
        </div>
      )}

      <main className={styles.main}>
        {/* Rail — this week's cake */}
        <aside className={styles.rail}>
          <div className={styles.railInner}>
            <div className={styles.railCard}>
              <div className={styles.railKicker}>This week&rsquo;s cake</div>
              <div className={styles.railCake}>
                {loading ? (
                  <div className={styles.loadingPlate} role="status" aria-label="Loading" />
                ) : (
                  <CakeRound count={roundSize} filled={filled} sharedCount={sharedCount} />
                )}
              </div>
              <button className={`btn-solid ${styles.railCta}`} onClick={openGive} disabled={isFull}>
                {isFull ? 'All slices taken' : CONFIG.tableCTA}
              </button>
              <div className={styles.railMeter}>
                <span style={{ width: `${roundSize ? (sharedCount / roundSize) * 100 : 0}%` }} />
              </div>
              <div className={styles.railNote}>
                {isFull
                  ? CONFIG.tableFullText
                  : `${slicesLeft} slice${slicesLeft === 1 ? '' : 's'} left.`}
              </div>
            </div>
          </div>
        </aside>

        {/* Wall */}
        {!error && (
          <div ref={wallRef} className={styles.wallWrap}>
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

      <Footer />

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

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
import { SuccessModal } from '../components/modals/SuccessModal';
import styles from './Table.module.css';

export default function Table() {
  const { slices, filled, sharedCount, isFull, loading, error, insertSlice, nextFreeIdx, roundSize } = useSlices();
  const [filter,      setFilter]      = useState('all');
  const [reading,     setReading]     = useState(null);
  const [success,     setSuccess]     = useState(null); // { slice, recipient } right after giving
  const [giving,      setGiving]      = useState(null);
  // The slice just given: held back from the cake and wall until its read
  // modal closes, then celebrated once so the motion isn't hidden behind it.
  const [pending,     setPending]     = useState(null);
  const [celebrate,   setCelebrate]   = useState(null);
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
    const to = (searchParams.get('to') ?? '').slice(0, 100);
    setSearchParams({}, { replace: true });
    if (!isFull) {
      const free = nextFreeIdx();
      if (free !== null) startTransition(() => setGiving({ idx: free, to }));
    }
  }, [loading, error, isFull, nextFreeIdx, searchParams, setSearchParams]);

  const openGive = useCallback(() => {
    if (isFull) return;
    const free = nextFreeIdx();
    if (free !== null) setGiving({ idx: free });
  }, [isFull, nextFreeIdx]);

  const handleGive = useCallback(async (data, recipient) => {
    const result = await insertSlice(data);
    if (result?.error === 'conflict') {
      const free = nextFreeIdx();
      if (free !== null) setGiving({ idx: free });
      return { ...result, full: free === null };
    }
    if (!result?.error && result?.data) {
      setGiving(null);
      if (CONFIG.tellThemEnabled) setSuccess({ slice: result.data, recipient });
      else setReading(result.data);
      setPending({ id: result.data.id, idx: result.data.idx });
      setTimeout(fireConfetti, 60);
    }
    return result;
  }, [insertSlice, nextFreeIdx]);

  // Once the screen for your own new slice closes, the cake and wall celebrate it
  const celebrateIfPending = useCallback((id) => {
    if (pending && id === pending.id) {
      setCelebrate(pending);
      setPending(null);
      setTimeout(() => setCelebrate(null), 1600);
    }
  }, [pending]);

  const closeReading = useCallback(() => {
    celebrateIfPending(reading?.id);
    setReading(null);
  }, [celebrateIfPending, reading]);

  const closeSuccess = useCallback(() => {
    celebrateIfPending(success?.slice.id);
    setSuccess(null);
  }, [celebrateIfPending, success]);

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
                  <CakeRound
                    count={roundSize}
                    filled={filled}
                    sharedCount={sharedCount}
                    holdIdx={pending?.idx}
                    liftIdx={celebrate?.idx}
                  />
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
              landedId={celebrate?.id}
              initialSearch={mentions}
            />
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      {reading ? (
        <ReadModal slice={reading} onClose={closeReading} />
      ) : null}
      {success ? (
        <SuccessModal slice={success.slice} recipient={success.recipient} onClose={closeSuccess} />
      ) : null}
      {giving !== null ? (
        <GiveModal
          idx={giving.idx}
          initialTo={giving.to}
          onClose={() => setGiving(null)}
          onGive={handleGive}
        />
      ) : null}
    </div>
  );
}

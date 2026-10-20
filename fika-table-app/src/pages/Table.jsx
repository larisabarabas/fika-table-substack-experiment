import { useState, useEffect, useRef, useTransition, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSlices } from '../hooks/useSlices';
import { CONFIG } from '../config';
import { ownedIds, editTokenFor } from '../lib/ownedSlices';
import { fireConfetti } from '../lib/confetti';
import CakeRound from '../components/cake/CakeRound';
import { Footer } from '../components/Footer';
import { AppreciationWall } from '../components/wall/AppreciationWall';
import { ReadModal } from '../components/modals/ReadModal';
import { GiveModal } from '../components/modals/GiveModal';
import { SuccessModal } from '../components/modals/SuccessModal';
import styles from './Table.module.css';

export default function Table() {
  const { slices, filled, sharedCount, isFull, loading, error, insertSlice, editSlice, removeSlice, nextFreeIdx, roundSize } = useSlices();
  const [filter,      setFilter]      = useState('all');
  const [reading,     setReading]     = useState(null);
  const [success,     setSuccess]     = useState(null); // { slice, recipient } right after giving
  const [giving,      setGiving]      = useState(null);
  const [editing,     setEditing]     = useState(null); // { slice, token }: the give form, filled in with a slice this browser gave
  const [banner,      setBanner]      = useState(null); // what just happened to a slice you edited or deleted
  // The slice just given: held back from the cake and wall until its read
  // modal closes, then celebrated once so the motion isn't hidden behind it.
  const [pending,     setPending]     = useState(null);
  const [celebrate,   setCelebrate]   = useState(null);
  const [, startTransition]   = useTransition();
  const giveHandled           = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mentions] = useState(() => searchParams.get('mentions') ?? '');

  const wallRef = useRef(null);

  // Slices this browser can edit (the list changes whenever one is given or deleted)
  // A refused edit forgets that slice's secret without touching the list, so it bumps a counter too
  const [ownedTick, setOwnedTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const owned = useMemo(() => ownedIds(), [slices, ownedTick]);

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

  const openEdit = useCallback((slice) => {
    const token = editTokenFor(slice.id);
    if (token) setEditing({ slice, token });
  }, []);

  const handleSave = useCallback(async (fields) => {
    const result = await editSlice(editing.slice.id, editing.token, fields);
    if (!result.error) {
      setEditing(null);
      setBanner('Saved. A Note you already posted on Substack keeps the old words.');
    } else if (result.error === 'forbidden') {
      setOwnedTick((n) => n + 1);
    }
    return result;
  }, [editSlice, editing]);

  const handleDelete = useCallback(async () => {
    const result = await removeSlice(editing.slice.id, editing.token);
    if (!result.error) {
      setEditing(null);
      setBanner(editing.slice.idx != null ? 'Deleted. Its slice is back on the cake.' : 'Deleted.');
    } else if (result.error === 'forbidden') {
      setOwnedTick((n) => n + 1);
    }
    return result;
  }, [removeSlice, editing]);

  const openGive = useCallback(() => {
    if (isFull) return;
    const free = nextFreeIdx();
    if (free !== null) setGiving({ idx: free });
  }, [isFull, nextFreeIdx]);

  const handleGive = useCallback(async (data, recipient) => {
    const result = await insertSlice(data);
    if (result?.error === 'conflict') {
      // insertSlice asked the database, so this is fresh where nextFreeIdx() would be stale
      if (result.freeIdx !== null) setGiving({ idx: result.freeIdx });
      return { ...result, full: result.freeIdx === null };
    }
    if (!result?.error && result?.data) {
      setGiving(null);
      if (CONFIG.tellThemEnabled) setSuccess({ slice: result.data, recipient, editToken: result.editToken });
      else setReading(result.data);
      setPending({ id: result.data.id, idx: result.data.idx });
      setTimeout(fireConfetti, 60);
    }
    return result;
  }, [insertSlice]);

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

  // "Edit or delete" on the success screen: the secret is still in hand, even if this browser could not store it
  const editFromSuccess = useCallback(() => {
    const { slice, editToken } = success;
    closeSuccess();
    setEditing({ slice, token: editToken });
  }, [success, closeSuccess]);

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
      {banner && (
        <div className={styles.noticeBanner} role="status">
          {banner}
          <button type="button" className={styles.noticeClose} onClick={() => setBanner(null)}>Dismiss</button>
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
              ownedIds={owned}
              landedId={celebrate?.id}
              initialSearch={mentions}
            />
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      {reading ? (
        <ReadModal
          slice={reading}
          onClose={closeReading}
          onEdit={owned.has(reading.id) ? (s) => { setReading(null); openEdit(s); } : undefined}
        />
      ) : null}
      {success ? (
        <SuccessModal
          slice={success.slice}
          recipient={success.recipient}
          onEdit={success.editToken ? editFromSuccess : undefined}
          onClose={closeSuccess}
        />
      ) : null}
      {editing ? (
        <GiveModal
          // a fresh form for each slice
          key={editing.slice.id}
          idx={editing.slice.idx}
          edit={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
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

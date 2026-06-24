import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSlice } from '../lib/api';
import { parseSubstackUrl } from '../lib/substack';
import { PASTELS, TYPE_LABEL, CONFIG } from '../config';
import styles from './Share.module.css';

const STATES = { LOADING: 'loading', OPEN: 'open', ERROR: 'error' };

function burstConfetti() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const container = document.getElementById('share-confetti');
  if (!container) return;

  for (let i = 0; i < 26; i++) {
    const el = document.createElement('span');
    el.className = styles.crumb;
    const size = 6 + Math.random() * 8;
    el.style.width = el.style.height = size + 'px';
    el.style.background = PASTELS[Math.floor(Math.random() * 8)];
    const ang = (Math.random() - 0.5) * Math.PI * 1.1;
    const dist = 120 + Math.random() * 220;
    const dx = Math.sin(ang) * dist;
    const riseVal = -(160 + Math.random() * 180);
    const fall = window.innerHeight * 0.7 + Math.random() * 160;
    el.animate([
      { transform: 'translate(-50%,-50%) scale(0)', opacity: 1, offset: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${riseVal}px)) scale(1) rotate(${Math.random() * 180}deg)`, opacity: 1, offset: 0.4 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${fall}px)) scale(.9) rotate(${Math.random() * 540}deg)`, opacity: 0, offset: 1 },
    ], { duration: 1500 + Math.random() * 900, easing: 'cubic-bezier(.2,.7,.4,1)' });
    container.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
}

export default function Share() {
  const { id } = useParams();
  const [slice, setSlice] = useState(null);
  const [state, setState] = useState(STATES.LOADING);
  const burstFired = useRef(false);

  useEffect(() => {
    let active = true;
    fetchSlice(id)
      .then((data) => {
        if (!active) return;
        setSlice(data);
        document.documentElement.style.setProperty('--foam', PASTELS[data.color % 8]);
        setState(STATES.OPEN);
        if (!burstFired.current) {
          burstFired.current = true;
          burstConfetti();
        }
      })
      .catch(() => {
        if (active) setState(STATES.ERROR);
      });
    return () => { active = false; };
  }, [id]);

  const subUrl = slice ? parseSubstackUrl(slice.toName) : null;
  const displayName = slice?.toName?.replace(/^@{2,}/, '@') ?? '';

  return (
    <div className={styles.page} data-state={state}>
      <div className={styles.brand}>
        <Link to="/" className={styles.brandMark}>Substack FIKA</Link>
        <span className={styles.brandPub}>
          for{' '}
          <a href={CONFIG.substackUrl} target="_blank" rel="noopener noreferrer" className={styles.brandPubNm}>
            {CONFIG.newsletter}
          </a>
        </span>
      </div>

      <div className={styles.stage}>
        {/* ── Loading ── */}
        <div className={styles.loading} aria-hidden="true">
          <div className={styles.skeleton}>
            <div className={`${styles.skLine} ${styles.skShort}`} />
            <div className={styles.skLine} />
            <div className={`${styles.skLine} ${styles.skMid}`} />
            <div className={styles.skPill} />
          </div>
          <div className={styles.loadingNote}>
            setting the table<i>.</i><i>.</i><i>.</i>
          </div>
        </div>

        {/* ── Open card ── */}
        {slice && (
          <div className={styles.cardWrap}>
            <div className={styles.card}>
              <span className={styles.quoteMark} aria-hidden="true">&ldquo;</span>
              <svg className={styles.steam} viewBox="0 0 40 34" aria-hidden="true">
                <path d="M10 32 q-6 -8 0 -15 q6 -7 0 -14" />
                <path d="M20 32 q6 -8 0 -15 q-6 -7 0 -14" />
                <path d="M30 32 q-6 -8 0 -15 q6 -7 0 -14" />
              </svg>
              <div className={styles.cardInner}>
                <p className={`${styles.fromLine} ${styles.reveal} ${styles.d1}`}>
                  From <span className={styles.fromLineNm}>{slice.fromName || 'a guest'}</span>
                  &nbsp;&middot; on this week&rsquo;s cake
                </p>
                <p className={`${styles.message} ${styles.reveal} ${styles.d2}`}>
                  {slice.message}
                </p>
                <div className={`${styles.typeTag} ${styles.reveal} ${styles.d2}`}>
                  {TYPE_LABEL[slice.toType]}
                </div>
                <div className={styles.actions}>
                  <Link
                    to="/cake?give=1"
                    className={`${styles.cta} ${styles.reveal} ${styles.d3}`}
                  >
                    Pass a slice to someone <span className={styles.ctaArr}>&rarr;</span>
                  </Link>
                  {subUrl && (
                    <a
                      href={subUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.subscribe} ${styles.reveal} ${styles.d4}`}
                    >
                      Subscribe to <span className={styles.subscribeNm}>{displayName}</span>
                      <span className={styles.subscribeArr}>&#8599;</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        <div className={styles.errorWrap} aria-hidden="true">
          <svg className={styles.errorCup} viewBox="0 0 56 50">
            <path d="M10 16 h30 v14 a15 15 0 0 1 -30 0 z" />
            <path d="M40 18 q12 0 12 8 t-12 8" />
            <path d="M10 44 h30" />
          </svg>
          <h2 className={styles.errorHead}>This slice has gone cold.</h2>
          <p className={styles.errorBody}>
            We couldn&rsquo;t find that note &mdash; but the table&rsquo;s still set. Pull up a chair.
          </p>
          <Link to="/cake?give=1" className={styles.errorCta}>
            Take a fresh slice <span className={styles.ctaArr}>&rarr;</span>
          </Link>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerScript}>{CONFIG.footerScript}</span>
        <span className={styles.footerSub}>{CONFIG.footerSub}</span>
      </div>

      <div className={styles.confetti} id="share-confetti" aria-hidden="true" />
    </div>
  );
}

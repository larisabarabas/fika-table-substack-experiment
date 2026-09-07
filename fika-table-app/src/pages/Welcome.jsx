import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONFIG, PASTELS, TO_NAME_FALLBACK } from '../config';
import { useSlices } from '../hooks/useSlices';
import { NameSpan } from '../components/NameLink';
import { ReadModal } from '../components/modals/ReadModal';
import { Footer } from '../components/Footer';
import styles from './Welcome.module.css';

const PROOF_COUNT = 3;

function clip(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
}

// Left-to-right DOM order doubles as the entrance-reveal stagger order.
const FIKA_ITEMS = [
  { src: '/illustrations/Flag-ornament.svg', cls: 'fikaTableFlag' },
  { src: '/illustrations/Kardemummabulle.svg', cls: 'fikaTableBulle' },
  { src: '/illustrations/Coffee-cup.svg', cls: 'fikaTableCup' },
  { src: '/illustrations/Prinsesstarta.svg', cls: 'fikaTableTarta', bob: true },
  { src: '/illustrations/Chokladbolls.svg', cls: 'fikaTableChoklad' },
  { src: '/illustrations/Pepparkakor.svg', cls: 'fikaTablePeppar' },
];

const FIKA_TABLE = (
  <div className={styles.fikaTable} aria-hidden="true">
    {FIKA_ITEMS.map((item) => (
      <span key={item.src} className={`${styles.fikaTableItemWrap} ${styles[item.cls]}`} data-reveal-item>
        <img
          src={item.src}
          alt=""
          className={`${styles.fikaTableImg} ${item.bob ? styles.fikaTableBob : ''}`}
        />
      </span>
    ))}
  </div>
);

// Module-level, not state: survives remounts within the same page load so the
// reveal never replays when the user navigates back to this page.
let hasRevealed = false;

// Resolves once an <img> has settled — loaded or failed, either counts.
function whenImgSettled(img) {
  if (img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      img.removeEventListener('load', done);
      img.removeEventListener('error', done);
      resolve();
    };
    img.addEventListener('load', done);
    img.addEventListener('error', done);
  });
}

function runReveal(root) {
  const animations = [];

  root.querySelectorAll('[data-reveal-item]').forEach((el, i) => {
    animations.push(
      el.animate(
        [
          { opacity: 0, transform: 'translateY(22px)', offset: 0 },
          { opacity: 1, transform: 'translateY(-3px)', offset: 0.72 },
          { opacity: 1, transform: 'translateY(0)', offset: 1 },
        ],
        { duration: 620, delay: 240 + i * 95, easing: 'cubic-bezier(.2,.85,.3,1)', fill: 'both' }
      )
    );
  });

  root.querySelectorAll('[data-reveal-copy]').forEach((el) => {
    const i = Number(el.dataset.revealCopy);
    animations.push(
      el.animate(
        [
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 620, delay: 620 + i * 85, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' }
      )
    );
  });

  Promise.all(animations.map((a) => a.finished.catch(() => {}))).then(() => {
    document.documentElement.removeAttribute('data-reveal');
  });
}

export default function Welcome() {
  const { slices, currentRound, roundSize, takenThisRound, loading, error } = useSlices();
  const [reading, setReading] = useState(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    // StrictMode double-invokes effects on the *same* DOM node in dev; guard
    // per-node so the in-flight sequence from the first invocation isn't
    // short-circuited by the second.
    if (root.dataset.revealHandled) return;
    root.dataset.revealHandled = '1';

    if (hasRevealed) {
      // A real remount (route back to this page) after the reveal already
      // ran once this page load — nothing replays, just don't stay hidden.
      document.documentElement.removeAttribute('data-reveal');
      return;
    }
    hasRevealed = true;

    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    const imgs = Array.from(root.querySelectorAll('[data-reveal-item] img'));
    const settled = Promise.all(imgs.map(whenImgSettled));
    const timeout = new Promise((resolve) => setTimeout(resolve, 2200));

    Promise.race([settled, timeout]).then(() => runReveal(root));
  }, []);

  const wordsThisRound = slices.filter((s) => s.round === currentRound && s.message);
  const proofWords = wordsThisRound.slice(0, PROOF_COUNT);
  const slicesLeft = Math.max(roundSize - takenThisRound, 0);

  return (
    <div className={styles.page} ref={pageRef}>
      <main className={styles.wrap}>
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <img
              src="/illustrations/Fika_logo_text.svg"
              alt="Fika"
              className={`${styles.logo} ${styles.revealCopy}`}
              data-reveal-copy="0"
            />
            <p className={`eyebrow ${styles.revealCopy}`} data-reveal-copy="0">{CONFIG.welcomeEyebrow}</p>
            <h1 className={`${styles.headline} ${styles.revealCopy}`} data-reveal-copy="1">
              <span>{CONFIG.welcomeHeadline[0]}</span>
              <span className={styles.headlineScript}>{CONFIG.welcomeHeadline[1]}</span>
            </h1>
          </div>

          {FIKA_TABLE}
        </header>

        <p className={`${styles.poetic} ${styles.revealCopy}`} data-reveal-copy="2">{CONFIG.welcomePoetic}</p>
        <p className={`${styles.mechanic} ${styles.revealCopy}`} data-reveal-copy="3">
          {CONFIG.welcomeMechanic.map((part, i) =>
            part.bold ? <b key={i}>{part.text}</b> : <span key={i}>{part.text}</span>
          )}
        </p>

        <div
          className={`${styles.datepill} ${error ? styles.datepillUnknown : ''} ${styles.revealCopy}`}
          data-reveal-copy="5"
        >
          <span className={styles.dot} aria-hidden="true" />
          {loading ? (
            <span className={styles.pillSkeleton} aria-hidden="true" />
          ) : error ? (
            <span>{CONFIG.welcomePillError}</span>
          ) : (
            <>
              This week&rsquo;s cake &middot;{' '}
              <b>{slicesLeft > 0 ? `${slicesLeft} slice${slicesLeft === 1 ? '' : 's'} left` : 'all slices taken'}</b>
            </>
          )}
        </div>

        <div className={`${styles.actions} ${styles.revealCopy}`} data-reveal-copy="4">
          <Link to="/table?give=1" className="btn-solid">
            {CONFIG.welcomeCTA} <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
          <Link to="/table" className="btn-ghost">
            {CONFIG.welcomeGhostCTA}
          </Link>
        </div>

        {loading ? (
          <div className={`${styles.proof} ${styles.revealCopy}`} data-reveal-copy="6">
            <div className={styles.proofHead}>Already on the table this week</div>
            <div className={styles.spinner} role="status" aria-label="Loading" />
          </div>
        ) : proofWords.length > 0 && (
          <div className={`${styles.proof} ${styles.revealCopy}`} data-reveal-copy="6">
            <div className={styles.proofHead}>Already on the table this week</div>
            <div className={styles.words} style={{ '--card-count': proofWords.length }}>
              {proofWords.map((w) => (
                <button key={w.id} className={styles.word} onClick={() => setReading(w)}>
                  <span className={styles.wordFrost} style={{ background: PASTELS[w.color % 8] }} />
                  <div className={styles.wordIn}>
                    <div className={styles.wordTo}>
                      For <NameSpan name={w.toName} fallback={TO_NAME_FALLBACK[w.toType] ?? 'the table'} />
                    </div>
                    <p className={styles.wordMsg}>{clip(w.message, 120)}</p>
                    <div className={styles.wordFrom}>
                      <span className={styles.wordTag}>{w.toType || 'writer'}</span>
                      from <NameSpan name={w.fromName} fallback="a guest" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className={styles.micro}>
              {proofWords.length < takenThisRound ? (
                <><b>{takenThisRound} kind words</b> shared so far &middot; a few pinned above &middot; fresh cake every week</>
              ) : (
                <><b>{takenThisRound} kind word{takenThisRound === 1 ? '' : 's'}</b> shared so far &middot; fresh cake every week</>
              )}
            </p>
          </div>
        )}
      </main>

      <Footer
        className={`${styles.footerLayer} ${styles.revealCopy}`}
        scriptClassName={styles.footerScriptLg}
        data-reveal-copy="7"
      >
        <p className={styles.footerSub}>
          <span>created by</span>
          <a href={CONFIG.creatorSite} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
            {CONFIG.creator}
          </a>
          <span className={styles.footerSep}>&middot;</span>
          <Link to="/privacy" className={styles.footerLink}>Privacy</Link>
        </p>
      </Footer>

      {reading ? <ReadModal slice={reading} onClose={() => setReading(null)} /> : null}
    </div>
  );
}

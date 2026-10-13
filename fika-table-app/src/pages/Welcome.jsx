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
  const featured = wordsThisRound[0];
  const moreWords = wordsThisRound.slice(1, 1 + PROOF_COUNT);
  const slicesLeft = Math.max(roundSize - takenThisRound, 0);

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.top}>
        <img
          src="/illustrations/Fika_logo_text.svg"
          alt="Fika"
          className={`${styles.logo} ${styles.revealCopy}`}
          data-reveal-copy="0"
        />
      </div>

      <header className={styles.hero}>
        <div className={styles.copy}>
          <h1 className={`${styles.headline} ${styles.revealCopy}`} data-reveal-copy="1">
            <span>{CONFIG.welcomeHeadline[0]}</span>
            <span>{CONFIG.welcomeHeadline[1]}</span>
          </h1>
          <p className={`${styles.lede} ${styles.revealCopy}`} data-reveal-copy="2">
            {CONFIG.welcomeMechanic.map((part, i) =>
              part.bold ? <b key={i}>{part.text}</b> : <span key={i}>{part.text}</span>
            )}
          </p>
          <div className={`${styles.actions} ${styles.revealCopy}`} data-reveal-copy="3">
            <Link to="/table?give=1" className="btn-solid">{CONFIG.welcomeCTA}</Link>
            <Link to="/table" className={styles.browse}>{CONFIG.welcomeGhostCTA}</Link>
          </div>
          <p
            className={`${styles.status} ${error ? styles.statusUnknown : ''} ${styles.revealCopy}`}
            data-reveal-copy="4"
          >
            <span className={styles.dot} aria-hidden="true" />
            {loading ? (
              <span className={styles.pillSkeleton} aria-hidden="true" />
            ) : error ? (
              <span>{CONFIG.welcomePillError}</span>
            ) : slicesLeft > 0 ? (
              <span><b>{slicesLeft} slice{slicesLeft === 1 ? '' : 's'}</b> left on this week&rsquo;s cake</span>
            ) : (
              <span>This week&rsquo;s cake is all gone. A new one comes next week.</span>
            )}
          </p>
        </div>

        <div className={styles.scene}>
          {FIKA_TABLE}
          {featured && (
            <button
              className={`${styles.placeCard} ${styles.revealCopy}`}
              data-reveal-copy="5"
              onClick={() => setReading(featured)}
            >
              <span className="frosting" style={{ '--frost': PASTELS[featured.color % 8] }} />
              <span className={styles.placeIn}>
                <span className={styles.placeTo}>
                  For <NameSpan name={featured.toName} fallback={TO_NAME_FALLBACK[featured.toType] ?? 'the table'} />
                </span>
                <span className={styles.placeMsg}>{clip(featured.message, 110)}</span>
                <span className={styles.placeFrom}>
                  from <NameSpan name={featured.fromName} fallback="a guest" />
                </span>
              </span>
            </button>
          )}
        </div>
      </header>

      <main className={styles.below}>
        <p className={`${styles.poetic} ${styles.revealCopy}`} data-reveal-copy="6">{CONFIG.welcomePoetic}</p>

        {loading ? (
          <div className={`${styles.proof} ${styles.revealCopy}`} data-reveal-copy="7">
            <h2 className={styles.proofHead}>More from the table</h2>
            <div className={styles.spinner} role="status" aria-label="Loading" />
          </div>
        ) : moreWords.length > 0 && (
          <div className={`${styles.proof} ${styles.revealCopy}`} data-reveal-copy="7">
            <h2 className={styles.proofHead}>More from the table</h2>
            <div className={styles.words} style={{ '--card-count': moreWords.length }}>
              {moreWords.map((w) => (
                <button key={w.id} className={styles.word} onClick={() => setReading(w)}>
                  <span className="frosting" style={{ '--frost': PASTELS[w.color % 8] }} />
                  <span className={styles.wordIn}>
                    <span className={styles.wordTo}>
                      For <NameSpan name={w.toName} fallback={TO_NAME_FALLBACK[w.toType] ?? 'the table'} />
                    </span>
                    <span className={styles.wordMsg}>{clip(w.message, 120)}</span>
                    <span className={styles.wordFrom}>
                      from <NameSpan name={w.fromName} fallback="a guest" />
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <p className={styles.micro}>
              <b>{takenThisRound} kind word{takenThisRound === 1 ? '' : 's'}</b> shared so far this week.
            </p>
          </div>
        )}
      </main>

      <Footer
        className={`${styles.footerLayer} ${styles.revealCopy}`}
        scriptClassName={styles.footerScriptLg}
        data-reveal-copy="8"
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

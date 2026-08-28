import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONFIG, PASTELS, TO_NAME_FALLBACK } from '../config';
import { useSlices } from '../hooks/useSlices';
import { NameSpan } from '../components/NameLink';
import { ReadModal } from '../components/modals/ReadModal';
import styles from './Welcome.module.css';

const PROOF_COUNT = 3;

function clip(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
}

const FIKA_TABLE = (
  <div className={styles.fikaTable} aria-hidden="true">
    <img src="/illustrations/Flag-ornament.svg" alt="" className={`${styles.fikaTableItem} ${styles.fikaTableFlag}`} />
    <img src="/illustrations/Kardemummabulle.svg" alt="" className={`${styles.fikaTableItem} ${styles.fikaTableBulle}`} />
    <img src="/illustrations/Coffee-cup.svg" alt="" className={`${styles.fikaTableItem} ${styles.fikaTableCup}`} />
    <img src="/illustrations/Prinsesstarta.svg" alt="" className={`${styles.fikaTableItem} ${styles.fikaTableTarta}`} />
    <img src="/illustrations/Chokladbolls.svg" alt="" className={`${styles.fikaTableItem} ${styles.fikaTableChoklad}`} />
    <img src="/illustrations/Pepparkakor.svg" alt="" className={`${styles.fikaTableItem} ${styles.fikaTablePeppar}`} />
  </div>
);

export default function Welcome() {
  const { slices, currentRound, roundSize, takenThisRound, loading } = useSlices();
  const [reading, setReading] = useState(null);

  const wordsThisRound = slices.filter((s) => s.round === currentRound && s.message);
  const proofWords = wordsThisRound.slice(0, PROOF_COUNT);
  const slicesLeft = Math.max(roundSize - takenThisRound, 0);

  return (
    <div className={styles.page}>
      <main className={styles.wrap}>
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <img src="/illustrations/Fika_logo_text.svg" alt="Fika" className={styles.logo} />

            <p className="eyebrow">{CONFIG.welcomeEyebrow}</p>

            <h1 className={styles.headline}>
              <span>{CONFIG.welcomeHeadline[0]}</span>
              <em>{CONFIG.welcomeHeadline[1]}</em>
            </h1>
          </div>

          {FIKA_TABLE}
        </div>

        <p className={styles.poetic}>{CONFIG.welcomePoetic}</p>
        <p className={styles.mechanic}>
          {CONFIG.welcomeMechanic.map((part, i) =>
            part.bold ? <b key={i}>{part.text}</b> : <span key={i}>{part.text}</span>
          )}
        </p>

        <div className={styles.datepill}>
          <span className={styles.dot} aria-hidden="true" />
          {loading ? (
            <span className={styles.pillSkeleton} aria-hidden="true" />
          ) : (
            <>
              This week&rsquo;s cake &middot;{' '}
              <b>{slicesLeft > 0 ? `${slicesLeft} slice${slicesLeft === 1 ? '' : 's'} left` : 'all slices taken'}</b>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <Link to="/cake?give=1" className="btn-solid">
            {CONFIG.welcomeCTA} <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
          <Link to="/cake" className="btn-ghost">
            {CONFIG.welcomeGhostCTA}
          </Link>
        </div>

        {loading ? (
          <div className={styles.proof}>
            <div className={styles.proofHead}>Already on the table this week</div>
            <div className={styles.spinner} role="status" aria-label="Loading" />
          </div>
        ) : proofWords.length > 0 && (
          <div className={styles.proof}>
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

      <footer className={styles.footer}>
        <p className={styles.footerScript}>{CONFIG.footerScript}</p>
        <p className={styles.footerSub}>
          <a href={CONFIG.substackUrl} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
            {CONFIG.newsletter}
          </a>
          <span className={styles.footerSep}>&middot;</span>
          <Link to="/privacy" className={styles.footerLink}>Privacy</Link>
        </p>
      </footer>

      {reading ? <ReadModal slice={reading} onClose={() => setReading(null)} /> : null}
    </div>
  );
}

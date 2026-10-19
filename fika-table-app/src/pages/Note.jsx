import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSlice } from '../lib/api';
import { RE_MULTI_AT } from '../lib/substack';
import { TO_NAME_FALLBACK } from '../config';
import { ShareCard } from '../components/share/ShareCard';
import { Footer } from '../components/Footer';
import styles from './Note.module.css';

// Where the person a kind word is for lands when they follow a Note's link.
// Quiet on purpose: the card first, one action, no confetti.
export default function Note() {
  const { id } = useParams();
  const [slice, setSlice] = useState(null);
  const [state, setState] = useState('loading'); // 'loading' | 'open' | 'error'

  useEffect(() => {
    let active = true;
    fetchSlice(id)
      .then((data) => { if (active) { setSlice(data); setState('open'); } })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [id]);

  const giver = slice?.fromName ? slice.fromName.replace(RE_MULTI_AT, '@') : null;
  // "left you a kind word" only makes sense when the word names someone
  const named = !!slice && slice.toType !== 'anyone' && slice.toName !== TO_NAME_FALLBACK[slice.toType];
  const heading = named
    ? `${giver ?? 'Someone'} left you a kind word`
    : `${giver ?? 'Someone'} left a kind word`;
  // First word of a name; a handle stays whole
  const giverShort = giver && !giver.startsWith('@') ? giver.split(/\s+/)[0] : giver;

  useEffect(() => {
    if (state !== 'open') return undefined;
    const before = document.title;
    document.title = heading;
    return () => { document.title = before; };
  }, [state, heading]);

  return (
    <div className={styles.page} data-state={state}>
      <Link to="/" className={styles.logoLink} aria-label="Fika — back to the welcome page">
        <img src="/illustrations/Fika_logo_text.svg" alt="Fika" className={styles.logo} />
      </Link>

      <main className={styles.stage}>
        {state === 'loading' && (
          <div className={styles.skeleton} role="status" aria-label="Loading">
            <div className={`${styles.skLine} ${styles.skHead}`} />
            <div className={styles.skCard} />
          </div>
        )}

        {state === 'open' && (
          <>
            <h1 className={styles.heading}>{heading}</h1>
            <ShareCard slice={slice} />
            <div className={styles.actions}>
              <Link to="/table?give=1" className="btn-solid">Write a kind word to someone else</Link>
              {giver && named && (
                <Link
                  to={`/table?give=1&to=${encodeURIComponent(slice.fromName)}`}
                  className={styles.back}
                >
                  Send {giverShort} a kind word back
                </Link>
              )}
            </div>
            <p className={styles.about}>
              Fika is a public wall of kind words for Substack readers and writers.
            </p>
          </>
        )}

        {state === 'error' && (
          <div className={styles.error}>
            <h1 className={styles.heading}>We couldn&rsquo;t find that kind word</h1>
            <p className={styles.about}>The table&rsquo;s still set. You can leave one of your own.</p>
            <Link to="/table?give=1" className="btn-solid">Send your kind word</Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

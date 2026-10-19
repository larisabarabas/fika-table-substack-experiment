import { useState } from 'react';
import { Overlay, CloseIcon } from './Overlay';
import { ShareCard } from '../share/ShareCard';
import { ShareSheet } from '../share/ShareSheet';
import { TO_NAME_FALLBACK } from '../../config';
import { shortName } from '../../lib/recipient.js';
import { getShareUrl, getNoteUrl, buildTellNote } from '../../lib/shareText.js';
import styles from './modals.module.css';

const NOTES_URL = 'https://substack.com/notes';

// Who, if anyone, there is to tell. Only a person we verified while typing can be tagged.
function kindOf(slice, recipient) {
  if (recipient?.verified && recipient.profile?.handle) return 'person';
  if (slice.toType === 'anyone') return 'table';
  if (slice.toName === TO_NAME_FALLBACK[slice.toType]) return 'unnamed';
  return 'unmatched';
}

const HINTS = {
  table: 'This word is on the table for anyone. Copy a link to share it where you like.',
  unnamed: 'You didn’t name anyone, so there is nobody to tell. Copy a link to share it where you like.',
  unmatched: 'We couldn’t match this name to a Substack profile, so there is nothing to link in a Note. Copy a link to share it instead.',
};

// Shown right after someone gives a kind word. One clear next step: tell the person.
export function SuccessModal({ slice, recipient, onClose }) {
  const [view, setView] = useState('done');   // 'done' | 'note'
  const [copied, setCopied] = useState(null); // null | 'yes' | 'failed'
  const [linkCopied, setLinkCopied] = useState(false);
  const [more, setMore] = useState(false);

  const kind = kindOf(slice, recipient);
  const first = kind === 'person' ? shortName(recipient.profile) : '';
  const note = kind === 'person'
    ? buildTellNote({
        profileUrl: `https://substack.com/@${recipient.profile.handle}`,
        message: slice.message,
        noteUrl: getNoteUrl(slice.id),
      })
    : '';

  const openNotes = () => window.open(NOTES_URL, '_blank', 'noopener,noreferrer');

  // Copy and open in the same tap: both start inside the click, so a phone's popup
  // and clipboard rules treat them as the person's own action.
  const copyAndOpen = () => {
    const copy = navigator.clipboard?.writeText(note);
    openNotes();
    Promise.resolve(copy)
      .then(() => setCopied(copy ? 'yes' : 'failed'))
      .catch(() => setCopied('failed'));
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(getShareUrl(slice.id))
      .then(() => setLinkCopied(true))
      .catch(() => setMore(true));
  };

  const close = (
    <button className={styles.closeBtn} onClick={onClose} aria-label="Close"><CloseIcon /></button>
  );

  if (view === 'note') {
    return (
      <Overlay onClose={onClose} wide label="Your Note">
        <div className={styles.success}>
          <div className={styles.giveHead}>
            <div>
              <h3 className={styles.giveTitle}>Your Note</h3>
              <p className={styles.giveSub}>This is exactly what we will copy.</p>
            </div>
            {close}
          </div>

          <div className={styles.noteBox} tabIndex={0} aria-label="The Note we will copy">{note}</div>

          {!slice.fromName && (
            <div className={styles.lookupWarn}>
              Your Note will show your Substack name, even though you left this unsigned on Fika.
            </div>
          )}

          <button
            className={`btn-solid ${styles.fullBtn} ${copied === 'yes' ? styles.btnDone : ''}`}
            disabled={copied === 'yes'}
            onClick={copyAndOpen}
          >
            {copied === 'yes' ? '✓ Copied' : 'Copy and open Substack'}
          </button>
          <p className={styles.hint} aria-live="polite">
            {copied === 'yes' && <>Copied. Paste it into your Note, then check that {first} turned into a link.</>}
            {copied === 'failed' && <>We couldn&rsquo;t copy it automatically. Select the text above and copy it, then paste it into your Note.</>}
            {!copied && <>We copy first, then open Substack in the same tap.</>}
          </p>

          {copied && (
            <div className={styles.confirmRow}>
              <button type="button" className={`btn-ghost ${styles.btnSm}`} onClick={openNotes}>Open Substack again</button>
              <button type="button" className={`btn-ghost ${styles.btnSm}`} onClick={onClose}>Back to the table</button>
            </div>
          )}
          {!copied && (
            <button type="button" className={styles.linkBtn} onClick={() => setView('done')}>Back</button>
          )}
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose} wide label="Your slice is on the table">
      <div className={styles.success}>
        <div className={styles.giveHead}>
          <h3 className={styles.giveTitle}>Your slice is on the table</h3>
          {close}
        </div>

        <ShareCard slice={slice} />

        {kind === 'person' ? (
          <button className={`btn-solid ${styles.fullBtn}`} onClick={() => setView('note')}>
            Tell {first} on Substack
          </button>
        ) : (
          <button className={`btn-solid ${styles.fullBtn}`} onClick={copyLink}>
            {linkCopied ? 'Link copied' : 'Copy link to share'}
          </button>
        )}
        <p className={styles.hint} aria-live="polite">
          {kind === 'person'
            ? <>{first} doesn&rsquo;t know yet. We&rsquo;ll copy a ready-made Note and open Substack.</>
            : linkCopied ? 'Copied. Paste it wherever you want to share it.' : HINTS[kind]}
        </p>

        <div className={styles.moreWrap}>
          <button
            type="button"
            className={styles.linkBtn}
            aria-expanded={more}
            onClick={() => setMore((v) => !v)}
          >
            Other ways to share
          </button>
          {/* Mounted only when open: the share sheet carries the hidden poster that Download captures */}
          {more && <ShareSheet slice={slice} />}
        </div>

        <button type="button" className={styles.linkBtn} onClick={onClose}>Back to the table</button>
      </div>
    </Overlay>
  );
}

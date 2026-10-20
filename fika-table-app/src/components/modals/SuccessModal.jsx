import { useState } from 'react';
import { Overlay, CloseIcon } from './Overlay';
import { ShareCard } from '../share/ShareCard';
import { ShareSheet } from '../share/ShareSheet';
import { TO_NAME_FALLBACK } from '../../config';
import { shortName } from '../../lib/recipient.js';
import { getShareUrl, getNoteUrl, getEditUrl, buildTellNote } from '../../lib/shareText.js';
import { EDIT_WINDOW_HOURS } from '../../lib/editRules.js';
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
export function SuccessModal({ slice, recipient, editToken, onClose }) {
  const [view, setView] = useState('done');   // 'done' | 'note'
  const [copied, setCopied] = useState(null); // null | 'yes' | 'failed'
  const [linkCopied, setLinkCopied] = useState(false);
  const [editCopied, setEditCopied] = useState(null); // null | 'yes' | 'failed'

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
    const copy = navigator.clipboard?.writeText(getShareUrl(slice.id));
    Promise.resolve(copy)
      .then(() => setLinkCopied(copy ? 'yes' : 'failed'))
      .catch(() => setLinkCopied('failed'));
  };

  const editUrl = editToken ? getEditUrl(slice.id, editToken) : '';
  const copyEditLink = () => {
    const copy = navigator.clipboard?.writeText(editUrl);
    Promise.resolve(copy)
      .then(() => setEditCopied(copy ? 'yes' : 'failed'))
      .catch(() => setEditCopied('failed'));
  };

  const close = (
    <button className={styles.closeBtn} onClick={onClose} aria-label="Close"><CloseIcon /></button>
  );

  if (view === 'note') {
    return (
      <Overlay onClose={onClose} wide label="Your Note">
        <div className={styles.success}>
          <div className={styles.giveHead}>
            <h3 className={styles.giveTitle}>Your Note</h3>
            {close}
          </div>
          <p className={styles.giveSub}>This is exactly what we will copy.</p>

          <div className={styles.noteBox} tabIndex={0} aria-label="The Note we will copy">{note}</div>

          {!slice.fromName && (
            <div className={styles.lookupWarn}>
              Your Note will show your Substack name, even though you left this unsigned on Fika.
            </div>
          )}

          <div className={styles.tellGroup}>
            <button
              className={`btn-solid ${styles.fullBtn} ${copied === 'yes' ? styles.btnDone : ''}`}
              disabled={copied === 'yes'}
              onClick={copyAndOpen}
            >
              {copied === 'yes' ? '\u2713 Copied' : 'Copy and open Substack'}
            </button>
            <p className={styles.hint} aria-live="polite">
              {copied === 'yes' && <>Copied. Paste it into your Note, then check that {first} turned into a link.</>}
              {copied === 'failed' && <>We couldn&rsquo;t copy it automatically. Select the text above and copy it, then paste it into your Note.</>}
              {!copied && <>We copy first, then open Substack in the same tap.</>}
            </p>
          </div>

          <div className={styles.successActions}>
            {copied
              ? <button type="button" className="btn-ghost" onClick={openNotes}>Open Substack again</button>
              : null}
            {copied
              ? <button type="button" className="btn-ghost" onClick={onClose}>Back to the table</button>
              : <button type="button" className="btn-ghost" onClick={() => setView('done')}>Back</button>}
          </div>
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

        <div className={styles.tellGroup}>
          {kind === 'person' ? (
            <button className={`btn-solid ${styles.fullBtn}`} onClick={() => setView('note')}>
              Tell {first} on Substack
            </button>
          ) : (
            <button className={`btn-solid ${styles.fullBtn}`} onClick={copyLink}>
              {linkCopied === 'yes' ? 'Link copied' : 'Copy link to share'}
            </button>
          )}
          <p className={styles.hint} aria-live="polite">
            {kind === 'person' && <>{first} doesn&rsquo;t know yet. We&rsquo;ll copy a ready-made Note and open Substack.</>}
            {kind !== 'person' && linkCopied === 'yes' && 'Copied. Paste it wherever you want to share it.'}
            {kind !== 'person' && linkCopied === 'failed' && <>We couldn&rsquo;t copy it automatically. Use Share or Copy text below.</>}
            {kind !== 'person' && !linkCopied && HINTS[kind]}
          </p>
        </div>

        <div className={styles.moreGroup}>
          <p className={styles.moreCaption}>Other ways to share</p>
          {/* Always mounted: the share sheet carries the hidden poster that Download captures */}
          <ShareSheet
            slice={slice}
            compact
            page={kind === 'person' ? 'note' : 'share'}
            omit={kind === 'person' ? [] : ['copyLink']}
          />
        </div>

        {editToken && (
          <div className={styles.moreGroup}>
            <p className={styles.moreCaption}>Change your mind later?</p>
            <button type="button" className="btn-ghost" onClick={copyEditLink}>
              {editCopied === 'yes' ? '\u2713 Link copied' : 'Copy your private edit link'}
            </button>
            <p className={styles.hint} aria-live="polite">
              {editCopied === 'failed'
                ? <>We couldn&rsquo;t copy it automatically. Select it here: <input className={styles.input} readOnly value={editUrl} onFocus={(e) => e.target.select()} aria-label="Your private edit link" /></>
                : <>Keep this link private: anyone with it can change or delete your kind word. Editing closes after {EDIT_WINDOW_HOURS} hours; deleting works any time.</>}
            </p>
          </div>
        )}

        <div className={styles.successActions}>
          <button type="button" className="btn-ghost" onClick={onClose}>Back to the table</button>
        </div>
      </div>
    </Overlay>
  );
}

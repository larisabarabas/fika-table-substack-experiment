import { useState, useEffect, useRef } from 'react';
import { Overlay, CloseIcon } from './Overlay';
import { PASTELS, TO_NAME_FALLBACK, CONFIG } from '../../config';
import { LOOKUP, recipientToSave } from '../../lib/recipient.js';
import { editTimeLeft } from '../../lib/editRules.js';
import { useProfileLookup } from '../../hooks/useProfileLookup.js';
import { LookupArea } from './LookupArea';
import styles from './modals.module.css';

const TYPE_OPTS = [
  { value: 'writer', label: 'For a writer',          ph: 'a name or Substack @handle', msgLabel: 'What do you appreciate about their writing?' },
  { value: 'reader', label: 'For a reader',          ph: 'a name or Substack @handle', msgLabel: 'What do you appreciate about them?' },
  { value: 'friend', label: 'For a friend',          ph: 'a name or Substack @handle', msgLabel: 'What do you appreciate about them?' },
  { value: 'host',   label: 'For the host',          ph: 'whoever keeps this going', msgLabel: 'What do you want to thank them for?' },
  { value: 'anyone', label: 'Leave it on the table', ph: 'you can leave this blank', full: true, msgLabel: "What's something good you want to leave for whoever needs it?" },
];

// The same form gives a kind word and, with `edit`, changes one you already gave: it opens
// filled in, who it is for is fixed, and saving or deleting goes through onSave / onDelete.
// Both return { error } on failure ('forbidden', 'window_closed' or anything else); on success the
// parent closes the modal.
export function GiveModal({ idx, onClose, onGive, initialTo = '', edit = null, onSave, onDelete }) {
  const editing = edit?.slice ?? null;
  const isNote = idx === null;
  const [toType,          setToType]          = useState(editing?.toType ?? 'writer');
  const [toName,          setToName]          = useState(initialTo);
  const [message,         setMessage]         = useState(editing?.message ?? '');
  const [fromName,        setFromName]        = useState(editing?.fromName ?? '');
  const [color,           setColor]           = useState(editing ? editing.color : isNote ? 0 : idx % 8);
  const [website,         setWebsite]         = useState(''); // honeypot — should stay empty
  const [submitting,      setSubmitting]      = useState(false);
  const [notice,          setNotice]          = useState(null); // { tone: 'error' | 'caution', text } shown at the top of the card
  const noticeRef = useRef(null);
  const [cakeFull,        setCakeFull]        = useState(false); // the last slice went while this form was open
  const [showTypes,       setShowTypes]       = useState(false); // recipient-type picker is collapsed until asked for
  const [showColors,      setShowColors]      = useState(false); // icing color is auto-assigned; picker is opt-in
  const [fromTouched,     setFromTouched]     = useState(false); // when editing, the signature is only looked up once it is changed
  const [confirming,      setConfirming]      = useState(false); // asking "delete this kind word?"
  const [closed,          setClosed]          = useState(() => (editing ? !editTimeLeft(editing.createdAt).open : false));
  // One Substack lookup per field, and both behave the same way
  const toLookup   = useProfileLookup(toName, { initial: initialTo });
  const fromLookup = useProfileLookup(editing && !fromTouched ? '' : fromName);

  const cur    = TYPE_OPTS.find((o) => o.value === toType);
  const msgLen = message.trim().length;
  const valid  = msgLen > 1 && msgLen <= 1000;

  const recipient = recipientToSave({ typed: toName, lookup: toLookup.lookup });
  const signer    = recipientToSave({ typed: fromName, lookup: fromLookup.lookup });
  const lookingUp = toLookup.lookup.status === LOOKUP.SEARCHING || fromLookup.lookup.status === LOOKUP.SEARCHING;
  // What gets saved as the signature: an untouched one stays exactly as it was
  const signedAs  = editing && !fromTouched ? (editing.fromName ?? '') : signer.toName;
  const changed   = !!editing && (
    message.trim() !== editing.message || signedAs !== (editing.fromName ?? '') || color !== editing.color
  );

  const submit = async () => {
    if (!valid || website || submitting) return;
    setSubmitting(true);
    setNotice(null);
    const result = await onGive({
      idx,
      fromName: signedAs,
      toName:   recipient.toName || TO_NAME_FALLBACK[toType],
      toType,
      message:  message.trim(),
      color,
    }, { verified: recipient.verified, profile: recipient.profile });
    // Every failure hands the button back, so a taken slice never leaves it stuck
    if (result?.error) {
      if (result.full) setCakeFull(true);
      setNotice(
        result.error !== 'conflict'
          ? { tone: 'error', text: 'That didn’t go through. Check your connection and try again. Your words are still here.' }
          : result.full
            ? { tone: 'caution', text: 'That was the last slice. Your words are still here. Copy them, then come back when next week’s cake is out.' }
            : { tone: 'caution', text: 'Someone just took that slice, so we moved you to another one. Take it again when you’re ready.' }
      );
      setSubmitting(false);
    }
  };

  const editNotice = (error) => (
    error === 'forbidden'
      ? { tone: 'error', text: 'This link doesn’t match this kind word, so nothing was changed. Use the private link you copied when you gave it.' }
      : error === 'window_closed'
        ? { tone: 'caution', text: 'The editing window has closed, so this kind word can’t be changed any more. You can still delete it.' }
        : { tone: 'error', text: 'That didn’t go through. Check your connection and try again. Your words are still here.' }
  );

  const run = async (action) => {
    setSubmitting(true);
    setNotice(null);
    const result = await action();
    if (result?.error) {
      if (result.error === 'window_closed') setClosed(true);
      setConfirming(false);
      setNotice(editNotice(result.error));
      setSubmitting(false);
    }
  };
  const saveEdit = () => {
    if (!valid || !changed || closed || submitting || lookingUp) return;
    run(() => onSave({ message: message.trim(), fromName: signedAs, color }));
  };
  const deleteIt = () => { if (!submitting) run(() => onDelete()); };

  // The notice sits at the top of the card; on a phone the button that caused it is far below,
  // so bring it into view without stealing focus from the field the person is in
  useEffect(() => {
    if (!notice) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    noticeRef.current?.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
  }, [notice]);

  const displayToName   = editing ? (editing.toName || TO_NAME_FALLBACK[toType]) : (recipient.toName || TO_NAME_FALLBACK[toType]);
  const displayFromName = signedAs || 'you';
  const timeLeft        = editing ? editTimeLeft(editing.createdAt) : null;
  const showPreview     = msgLen > 1;

  return (
    <Overlay onClose={onClose} wide label={editing ? 'Edit your kind word' : 'Pour a coffee, take a slice'}>
      <div className={styles.give}>
        {/* Spam honeypot — hidden from real users, attractive to bots */}
        <div className={styles.honeypot} aria-hidden="true">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        {/* Only the title row sticks while a tall form scrolls, so the close button stays in reach */}
        <div className={styles.giveHead}>
          <h3 className={styles.giveTitle}>{editing ? 'Edit your kind word' : 'Pour a coffee, take a slice'}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>
        {/* Always mounted, so a message that appears is announced */}
        <div role="status" aria-live={notice?.tone === 'error' ? 'assertive' : 'polite'}>
          {notice && (
            <div
              id="give-notice"
              ref={noticeRef}
              className={`${styles.notice} ${notice.tone === 'error' ? styles.noticeError : styles.noticeCaution}`}
            >
              <svg className={styles.noticeIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5v4.2M8 11v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>{notice.text}</span>
            </div>
          )}
        </div>
        <p className={styles.giveSub}>
          {!editing ? CONFIG.giveModalSub : closed ? 'The editing window has closed. You can still delete it.' : `${timeLeft.label}. You can delete it any time.`}
        </p>

        <label htmlFor="give-message" className={styles.fieldLabel}>{editing ? 'Your kind word' : cur.msgLabel}</label>
        <textarea
          id="give-message"
          className={`${styles.input} ${styles.textarea}`}
          value={message}
          rows={3}
          placeholder="Even a short thank-you counts"
          readOnly={closed}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className={styles.charRow}>
          <p className={styles.charError}>{message.length > 1000 ? 'Your message is too long — please trim it to 1000 characters.' : ''}</p>
          <span className={`${styles.charCount} ${message.length > 1000 ? styles.charCountOver : ''}`}>
            {message.length} / 1000
          </span>
        </div>

        {editing ? (
          <>
            <div className={styles.toRow}>
              <span className={styles.toValue}>For {displayToName}</span>
            </div>
            <p className={styles.hint}>Who it&rsquo;s for can&rsquo;t change. To change that, delete this one and write a new one.</p>
          </>
        ) : (
          <div className={styles.toRow}>
            <span className={styles.toValue}>{cur.label}</span>
            <button
              type="button"
              className={styles.linkBtn}
              aria-expanded={showTypes}
              onClick={() => setShowTypes((v) => !v)}
            >
              {showTypes ? 'Done' : 'Change'}
            </button>
          </div>
        )}
        {!editing && showTypes && (
          <fieldset className={styles.typeSet}>
            <legend className={styles.srOnly}>Who's this slice for?</legend>
            <div className={styles.typeGrid}>
              {TYPE_OPTS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={toType === o.value}
                  className={`${styles.typeBtn} ${o.full ? styles.typeFull : ''} ${toType === o.value ? styles.typeBtnOn : ''}`}
                  onClick={() => {
                    setToType(o.value);
                    setShowTypes(false);
                    // "Leave it on the table" is anonymous — clear any recipient name
                    // and any profile already resolved for the old name
                    if (o.value === 'anyone') { setToName(''); toLookup.reset(); }
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* A word left on the table is for everyone, so there is no one to name */}
        {!editing && toType !== 'anyone' && (
          <>
          <label htmlFor="give-to" className={styles.fieldLabel}>
            Their name or Substack @handle <span className={styles.opt}>optional</span>
          </label>
          <input
            id="give-to"
            className={styles.input}
            value={toName}
            placeholder={cur.ph}
            maxLength={100}
            onChange={(e) => { setToName(e.target.value); toLookup.onTyping(e.target.value); }}
          />
          <LookupArea
            lookup={toLookup}
            typed={toName}
            who="them"
            onConfirm={toLookup.confirm}
            onReject={toLookup.reject}
            onRetry={toLookup.retry}
            onKeep={toLookup.keepPlain}
          />
          </>
        )}

        <label htmlFor="give-from" className={styles.fieldLabel}>
          Signed <span className={styles.opt}>optional</span>
        </label>
        <input
          id="give-from"
          className={styles.input}
          value={fromName}
          placeholder="your name or @handle"
          maxLength={100}
          readOnly={closed}
          onChange={(e) => { setFromName(e.target.value); setFromTouched(true); fromLookup.onTyping(e.target.value); }}
        />
        {(!editing || fromTouched) && (
          <LookupArea
            lookup={fromLookup}
            typed={fromName}
            who="you"
            onConfirm={fromLookup.confirm}
            onReject={fromLookup.reject}
            onRetry={fromLookup.retry}
            onKeep={fromLookup.keepPlain}
          />
        )}

        <div className={styles.colorRow}>
          <span className={styles.colorSwatch} style={{ background: PASTELS[color % PASTELS.length] }} aria-hidden="true" />
          <span className={styles.colorText}>Icing color for your card</span>
          <button
            type="button"
            className={styles.linkBtn}
            aria-expanded={showColors}
            disabled={closed}
            onClick={() => setShowColors((v) => !v)}
          >
            {showColors ? 'Done' : 'Change color'}
          </button>
        </div>
        {showColors && (
          <div className={styles.frostPick} role="group" aria-label="Icing color">
            {PASTELS.map((c, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Icing color ${i + 1}`}
                aria-pressed={color === i}
                className={`${styles.frostDot} ${color === i ? styles.frostDotOn : ''}`}
                style={{ background: c }}
                onClick={() => setColor(i)}
              />
            ))}
          </div>
        )}

        {showPreview && (
          <div className={styles.previewWrap}>
            <span className={styles.previewLabel}>Preview</span>
            <div className={styles.previewCard}>
              <span className="frosting" style={{ '--frost': PASTELS[color % PASTELS.length] }} />
              <div className={styles.previewHead}>
                <span className={styles.previewNames}>
                  <b>{displayFromName}</b>
                  {' '}<span className={styles.arrow}>to</span>{' '}
                  {displayToName}
                </span>
              </div>
              <div className={styles.previewBody}>
                <p className={styles.previewMsg}>{message}</p>
              </div>
            </div>
          </div>
        )}

        {editing ? (
          <>
            <div className={styles.giveActions}>
              <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
              {!closed && (
                <button className="btn-solid" disabled={!valid || !changed || submitting || lookingUp} onClick={saveEdit}>
                  {submitting && !confirming ? 'Saving…' : 'Save changes'}
                </button>
              )}
            </div>
            <div className={styles.deleteZone}>
              {!confirming ? (
                <button type="button" className={styles.deleteBtn} disabled={submitting} onClick={() => setConfirming(true)}>
                  Delete this kind word
                </button>
              ) : (
                <div className={styles.confirmBox} role="group" aria-label="Confirm delete">
                  <p className={styles.confirmText}>
                    Delete this kind word? It leaves the table for good{editing.idx != null && ' and its slice goes back on the cake'}.
                    A Note you posted on Substack will lead to a page that can&rsquo;t find it. This can&rsquo;t be undone.
                  </p>
                  <div className={styles.giveActions}>
                    <button type="button" className="btn-ghost" disabled={submitting} onClick={() => setConfirming(false)}>Keep it</button>
                    <button type="button" className={styles.deleteSolid} disabled={submitting} onClick={deleteIt}>
                      {submitting ? 'Deleting…' : 'Delete it'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.giveActions}>
            <button className="btn-ghost" onClick={onClose} disabled={submitting}>Maybe later</button>
            <button className="btn-solid" disabled={!valid || submitting || lookingUp || cakeFull} aria-describedby={cakeFull ? 'give-notice' : undefined} onClick={submit}>
              {cakeFull ? 'All slices taken' : submitting ? 'Taking the slice…' : 'Take the slice'}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}

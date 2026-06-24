import { useState } from 'react';
import { Overlay } from './Overlay';
import { PASTELS, TO_NAME_FALLBACK, CONFIG } from '../../config';
import styles from './modals.module.css';

const normalizeHandle = (name) => {
  if (!name) return name;
  const t = name.replace(/^@{2,}/, '@');
  return /^[A-Za-z0-9_.-]+$/.test(t) ? '@' + t : t;
};

const TYPE_OPTS = [
  { value: 'writer', label: 'For a writer',          ph: 'their name or Substack @handle' },
  { value: 'reader', label: 'For a reader',          ph: 'a name, @handle, or "the lurkers"' },
  { value: 'friend', label: 'For a friend',          ph: 'their name or @handle' },
  { value: 'host',   label: 'For the host',          ph: 'whoever keeps this going' },
  { value: 'anyone', label: 'Leave it on the table', ph: 'leave blank', full: true },
];

export function GiveModal({ idx, onClose, onGive }) {
  const isNote = idx === null;
  const [toType,      setToType]      = useState('anyone');
  const [toName,      setToName]      = useState('');
  const [message,     setMessage]     = useState('');
  const [fromName,    setFromName]    = useState('');
  const [color,       setColor]       = useState(isNote ? 0 : idx % 8);
  const [website,     setWebsite]     = useState(''); // honeypot — should stay empty
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const cur   = TYPE_OPTS.find((o) => o.value === toType);
  const valid = message.trim().length > 1;

  const submit = async () => {
    if (!valid || website || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await onGive({
      idx,
      fromName: fromName.trim(),
      toName:   normalizeHandle(toName.trim() || TO_NAME_FALLBACK[toType]),
      toType,
      message:  message.trim(),
      color,
    });
    if (result?.error && result.error !== 'conflict') {
      setSubmitError('Something went wrong — please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Overlay onClose={onClose} wide label="Pour a coffee, take a slice">
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

        <div className={styles.giveHead}>
          <div className={styles.kicker}>
            {isNote ? 'A kind word' : `This week · slice #${idx + 1}`}
          </div>
          <h3 className={styles.giveTitle}>Pour a coffee, take a slice</h3>
          <p className={styles.giveSub}>{CONFIG.giveModalSub}</p>
        </div>

        <label className={styles.fieldLabel}>Who's this slice for?</label>
        <div className={styles.typeGrid}>
          {TYPE_OPTS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={toType === o.value}
              className={`${styles.typeBtn} ${o.full ? styles.typeFull : ''} ${toType === o.value ? styles.typeBtnOn : ''}`}
              onClick={() => setToType(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        <label className={styles.fieldLabel}>
          Their name <span className={styles.opt}>optional</span>
        </label>
        <input
          className={styles.input}
          value={toName}
          placeholder={cur.ph}
          maxLength={100}
          onChange={(e) => setToName(e.target.value)}
        />
        <div className={styles.hint}>
          A Substack <b>@handle</b> (or profile link) becomes a link to their profile.
        </div>

        <label className={styles.fieldLabel}>Your kind word</label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={message}
          rows={3}
          placeholder="What do you appreciate about them?"
          maxLength={1000}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className={styles.giveRow}>
          <div className={styles.giveCol}>
            <label className={styles.fieldLabel}>
              Signed <span className={styles.opt}>optional</span>
            </label>
            <input
              className={styles.input}
              value={fromName}
              placeholder="your name or @handle"
              maxLength={100}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>
          <div className={styles.giveCol}>
            <label className={styles.fieldLabel}>Foam</label>
            <div className={styles.frostPick}>
              {PASTELS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Foam colour ${i + 1}`}
                  className={`${styles.frostDot} ${color === i ? styles.frostDotOn : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {submitError && (
          <p className={styles.submitError}>{submitError}</p>
        )}
        <div className={styles.giveActions}>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Maybe later</button>
          <button className="btn-solid" disabled={!valid || submitting} onClick={submit}>
            {submitting ? 'Taking the slice…' : 'Take the slice'}
          </button>
        </div>
      </div>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
    </Overlay>
  );
}

import { useState } from 'react';
import { Overlay } from './Overlay';
import { PASTELS, TO_NAME_FALLBACK, CONFIG } from '../../config';
import styles from './modals.module.css';

const TYPE_OPTS = [
  { value: 'host',   label: `Leave it for ${CONFIG.hostName}`, ph: 'leave blank' },
  { value: 'writer', label: 'Pass it to a writer',             ph: 'their name or Substack @handle' },
  { value: 'reader', label: 'Pass it to a reader',             ph: 'a name, @handle, or "the lurkers"' },
  { value: 'anyone', label: 'Leave it on the table',           ph: 'leave blank' },
];

export function GiveModal({ idx, onClose, onGive }) {
  const isNote = idx === null;
  const [toType,   setToType]   = useState('host');
  const [toName,   setToName]   = useState('');
  const [message,  setMessage]  = useState('');
  const [fromName, setFromName] = useState('');
  const [color,    setColor]    = useState(isNote ? 0 : idx % 8);
  const [website,  setWebsite]  = useState(''); // honeypot — should stay empty

  const cur   = TYPE_OPTS.find((o) => o.value === toType);
  const valid = message.trim().length > 1;

  const submit = () => {
    if (!valid || website) return; // silently block if honeypot filled
    onGive({
      idx,
      fromName: fromName.trim(),
      toName:   toName.trim() || TO_NAME_FALLBACK[toType],
      toType,
      message:  message.trim(),
      color,
    });
  };

  return (
    <Overlay onClose={onClose} wide label={isNote ? 'Leave a kind word' : 'Cut yourself a slice'}>
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
          <div className={styles.kicker}>{isNote ? 'Leave a note' : `Slice #${idx + 1}`}</div>
          <h3 className={styles.giveTitle}>{isNote ? 'Leave a kind word' : 'Cut yourself a slice'}</h3>
          <p className={styles.giveSub}>
            {isNote
              ? `A kind word for anyone at the table — it will appear on the appreciation wall.`
              : `A slice costs one kind word. Leave it for ${CONFIG.hostName}, or pass it to someone else at the table.`}
          </p>
        </div>

        <label className={styles.fieldLabel}>Who's this for?</label>
        <div className={styles.typeGrid}>
          {TYPE_OPTS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={toType === o.value}
              className={`${styles.typeBtn} ${toType === o.value ? styles.typeBtnOn : ''}`}
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
            <label className={styles.fieldLabel}>Frosting</label>
            <div className={styles.frostPick}>
              {PASTELS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Frosting colour ${i + 1}`}
                  className={`${styles.frostDot} ${color === i ? styles.frostDotOn : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(i)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.giveActions}>
          <button className="btn-ghost" onClick={onClose}>Maybe later</button>
          <button className="btn-solid" disabled={!valid} onClick={submit}>
            {isNote ? 'Leave the note' : 'Cut the slice'}
          </button>
        </div>
      </div>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
    </Overlay>
  );
}

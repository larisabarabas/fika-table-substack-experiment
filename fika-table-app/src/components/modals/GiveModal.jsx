import { useState, useEffect } from 'react';
import { Overlay } from './Overlay';
import { PASTELS, TO_NAME_FALLBACK, TYPE_LABEL, CONFIG } from '../../config';
import { extractHandle, RE_MULTI_AT } from '../../lib/substack';
import styles from './modals.module.css';

// Also strips Substack URLs to @handle before storing
const normalizeHandle = (name) => {
  if (!name) return name;
  const handle = extractHandle(name.trim());
  if (handle) return '@' + handle;
  const t = name.trim().replace(RE_MULTI_AT, '@');
  return /^[A-Za-z0-9_.-]+$/.test(t) ? '@' + t : t;
};

const TYPE_OPTS = [
  { value: 'writer', label: 'For a writer',          ph: 'a name or Substack @handle', msgLabel: 'What do you appreciate about their writing?' },
  { value: 'reader', label: 'For a reader',          ph: 'a name or Substack @handle', msgLabel: 'What do you appreciate about them?' },
  { value: 'friend', label: 'For a friend',          ph: 'a name or Substack @handle', msgLabel: 'What do you appreciate about them?' },
  { value: 'host',   label: 'For the host',          ph: 'whoever keeps this going', msgLabel: 'What do you want to thank them for?' },
  { value: 'anyone', label: 'Leave it on the table', ph: 'you can leave this blank', full: true, msgLabel: "What's something good you want to leave for whoever needs it?" },
];

export function GiveModal({ idx, onClose, onGive }) {
  const isNote = idx === null;
  const [toType,          setToType]          = useState('anyone');
  const [toName,          setToName]          = useState('');
  const [message,         setMessage]         = useState('');
  const [fromName,        setFromName]        = useState('');
  const [color,           setColor]           = useState(isNote ? 0 : idx % 8);
  const [website,         setWebsite]         = useState(''); // honeypot — should stay empty
  const [submitting,      setSubmitting]      = useState(false);
  const [submitError,     setSubmitError]     = useState(null);
  const [profile,         setProfile]         = useState(null);  // { name, image, description, handle }
  const [profileLoading,  setProfileLoading]  = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [profileError,    setProfileError]    = useState(false); // network / server error

  const cur    = TYPE_OPTS.find((o) => o.value === toType);
  const msgLen = message.trim().length;
  const valid  = msgLen > 1 && msgLen <= 1000;

  // On blur: collapse a pasted Substack URL/handle, or a name resolved to a
  // confirmed profile match, down to @handle so it's stored as a real link
  const handleToNameBlur = () => {
    const trimmed = toName.trim();
    if (trimmed.startsWith('@')) return;
    const handle = extractHandle(trimmed);
    if (handle) { setToName('@' + handle); return; }
    if (profile?.handle) setToName('@' + profile.handle);
  };

  // Debounced Substack profile preview fetch — all setState calls inside the callback (not sync in body)
  useEffect(() => {
    const trimmed = toName.trim();
    const handle = extractHandle(trimmed);
    // Plain text with no '@' is treated as a display name to search for; anything
    // containing '@' that isn't a valid handle/URL (e.g. a stray "@") is left alone
    const nameQuery = !handle && trimmed && !trimmed.includes('@') ? trimmed : null;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      if (!handle && !nameQuery) {
        setProfile(null); setProfileNotFound(false); setProfileError(false); setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      setProfile(null);
      setProfileNotFound(false);
      setProfileError(false);
      try {
        const param = handle ? `handle=${encodeURIComponent(handle)}` : `query=${encodeURIComponent(nameQuery)}`;
        const res = await fetch(`/api/substack-profile?${param}`);
        if (cancelled) return;
        if (!res.ok) {
          const isServerError = res.status === 503 || res.status >= 500;
          setProfile(null);
          setProfileNotFound(!isServerError);
          setProfileError(isServerError);
          setProfileLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setProfile(data.error ? null : data);
          setProfileNotFound(!!data.error);
          setProfileError(false);
          setProfileLoading(false);
        }
      } catch {
        if (!cancelled) { setProfile(null); setProfileNotFound(false); setProfileError(true); setProfileLoading(false); }
      }
    }, (handle || nameQuery) ? 600 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [toName]);

  const submit = async () => {
    if (!valid || website || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    // Prefer a confirmed profile match's real handle over the raw typed name,
    // independent of whether the field was blurred — a dismissed/no match
    // falls through to the plain text as before.
    const trimmedToName = toName.trim();
    const resolvedToName = profile?.handle && !extractHandle(trimmedToName) ? '@' + profile.handle : trimmedToName;
    const result = await onGive({
      idx,
      fromName: normalizeHandle(fromName.trim()),
      toName:   normalizeHandle(resolvedToName || TO_NAME_FALLBACK[toType]),
      toType,
      message:  message.trim(),
      color,
    });
    if (result?.error && result.error !== 'conflict') {
      setSubmitError('Something went wrong — please try again.');
      setSubmitting(false);
    }
  };

  const displayToName   = toName.trim() || TO_NAME_FALLBACK[toType];
  const displayFromName = fromName.trim() || 'you';
  const showPreview     = msgLen > 1;

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
              onClick={() => {
                setToType(o.value);
                // "Leave it on the table" is anonymous — clear any recipient name
                if (o.value === 'anyone') setToName('');
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        <label className={styles.fieldLabel}>
          Their name or Substack @handle <span className={styles.opt}>optional</span>
        </label>
        <input
          className={styles.input}
          value={toName}
          placeholder={cur.ph}
          maxLength={100}
          onChange={(e) => setToName(e.target.value)}
          onBlur={handleToNameBlur}
        />
        {!profileLoading && !profile && !profileNotFound && !profileError && (
          <div className={styles.hint}>
            A Substack <b>@handle</b> (or profile link) becomes a link to their profile.
          </div>
        )}
        {profileLoading && <div className={styles.hint}>Looking up profile…</div>}
        {!profileLoading && profileNotFound && (
          <div className={styles.hint}>
            No exact match —{' '}
            <a
              href={`https://substack.com/search/${encodeURIComponent(toName.trim().replace(/^@/, ''))}?searching=profile`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.hintLink}
            >
              search on Substack ↗
            </a>
          </div>
        )}
        {!profileLoading && profileError && (
          <div className={styles.hint}>Couldn't reach Substack — try again.</div>
        )}
        {profile && (
          <div className={styles.profileCard}>
            <a
              className={styles.profileLink}
              href={`https://substack.com/@${profile.handle}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.image && (
                <img className={styles.profileAvatar} src={profile.image} alt="" />
              )}
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{profile.name}</span>
                {profile.description && (
                  <span className={styles.profileDesc}>{profile.description}</span>
                )}
              </div>
            </a>
            <button
              type="button"
              className={styles.profileDismiss}
              onClick={() => setProfile(null)}
              aria-label="Dismiss profile"
            >✕</button>
          </div>
        )}

        <label className={styles.fieldLabel}>{cur.msgLabel}</label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={message}
          rows={3}
          placeholder="Write something kind…"
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className={styles.charRow}>
          <p className={styles.charError}>{message.length > 1000 ? 'Your message is too long — please trim it to 1000 characters.' : ''}</p>
          <span className={`${styles.charCount} ${message.length > 1000 ? styles.charCountOver : ''}`}>
            {message.length} / 1000
          </span>
        </div>

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
            <label className={styles.fieldLabel}>Pick your color</label>
            <div className={styles.hint}>shows up on your card at the table</div>
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

        {showPreview && (
          <div className={styles.previewWrap}>
            <span className={styles.previewLabel}>Preview</span>
            <div className={styles.previewCard}>
              <div className={styles.previewBand} style={{ background: PASTELS[color % PASTELS.length] }}>
                <span className={styles.previewNames}>
                  <b>{displayFromName}</b>
                  {' '}<i className={styles.arrow}>→</i>{' '}
                  {displayToName}
                </span>
              </div>
              <div className={styles.previewBody}>
                <p className={styles.previewMsg}>{message}</p>
                <div className={styles.readTag}>{TYPE_LABEL[toType]}</div>
              </div>
            </div>
          </div>
        )}

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

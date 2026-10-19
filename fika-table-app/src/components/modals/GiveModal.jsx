import { useState, useEffect } from 'react';
import { Overlay, CloseIcon } from './Overlay';
import { PASTELS, TO_NAME_FALLBACK, CONFIG } from '../../config';
import { extractHandle, RE_MULTI_AT } from '../../lib/substack';
import {
  LOOKUP, idleLookup, searchingLookup, classifyInput, lookupFromResult, linkTo, recipientToSave,
} from '../../lib/recipient.js';
import styles from './modals.module.css';

// Collapses an explicit @handle or Substack URL down to @handle before storing.
// Does NOT guess that a bare word (e.g. a plain first name like "Maria") is a
// handle — only extractHandle's confirmed patterns count, otherwise a signed
// name gets mistaken for an unverified Substack profile link downstream.
const normalizeHandle = (name) => {
  if (!name) return name;
  const trimmed = name.trim();
  const handle = extractHandle(trimmed);
  if (handle) return '@' + handle;
  return trimmed.replace(RE_MULTI_AT, '@');
};

// Falls back to initials when a Substack profile has no photo, so avatar-less
// results don't leave a blank gap in the profile card / candidate list
const getInitials = (name) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const Avatar = ({ image, name }) =>
  image
    ? <img className={styles.profileAvatar} src={image} alt="" />
    : <div className={styles.profileAvatarFallback} aria-hidden="true">{getInitials(name)}</div>;

// Picture, name, handle and bio. A real link, so the giver can check who it is on Substack.
const ProfileBody = ({ profile }) => (
  <a
    className={styles.profileLink}
    href={`https://substack.com/@${profile.handle}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    <Avatar image={profile.image} name={profile.name} />
    <div className={styles.profileInfo}>
      <span className={styles.profileName}>{profile.name}</span>
      <span className={styles.profileDesc}>@{profile.handle}</span>
      {profile.description && <span className={styles.profileDesc}>{profile.description}</span>}
    </div>
  </a>
);

const TYPE_OPTS = [
  { value: 'writer', label: 'For a writer',          ph: 'a name or Substack @handle', msgLabel: 'What do you appreciate about their writing?' },
  { value: 'reader', label: 'For a reader',          ph: 'a name or Substack @handle', msgLabel: 'What do you appreciate about them?' },
  { value: 'friend', label: 'For a friend',          ph: 'a name or Substack @handle', msgLabel: 'What do you appreciate about them?' },
  { value: 'host',   label: 'For the host',          ph: 'whoever keeps this going', msgLabel: 'What do you want to thank them for?' },
  { value: 'anyone', label: 'Leave it on the table', ph: 'you can leave this blank', full: true, msgLabel: "What's something good you want to leave for whoever needs it?" },
];

export function GiveModal({ idx, onClose, onGive, initialTo = '' }) {
  const isNote = idx === null;
  const [toType,          setToType]          = useState('writer');
  const [toName,          setToName]          = useState(initialTo);
  const [message,         setMessage]         = useState('');
  const [fromName,        setFromName]        = useState('');
  const [color,           setColor]           = useState(isNote ? 0 : idx % 8);
  const [website,         setWebsite]         = useState(''); // honeypot — should stay empty
  const [submitting,      setSubmitting]      = useState(false);
  const [submitError,     setSubmitError]     = useState(null);
  const [showTypes,       setShowTypes]       = useState(false); // recipient-type picker is collapsed until asked for
  const [showColors,      setShowColors]      = useState(false); // icing color is auto-assigned; picker is opt-in
  // see lib/recipient.js. A name passed in is looked up on open, so submitting waits for it.
  const [lookup,          setLookup]          = useState(classifyInput(initialTo).kind === 'none' ? idleLookup : searchingLookup);
  const [retry,           setRetry]           = useState(0);

  const cur    = TYPE_OPTS.find((o) => o.value === toType);
  const msgLen = message.trim().length;
  const valid  = msgLen > 1 && msgLen <= 1000;

  // Look the typed name up on Substack once the giver pauses. Typing puts the field in
  // "searching" straight away (see onChange), so a submit can't slip in before the answer.
  useEffect(() => {
    const input = classifyInput(toName);
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (cancelled) return;
      if (input.kind === 'none') { setLookup(idleLookup); return; }
      setLookup(searchingLookup);
      const giveUp = setTimeout(() => controller.abort(), 8000);
      try {
        const param = input.kind === 'handle' ? `handle=${encodeURIComponent(input.handle)}` : `query=${encodeURIComponent(input.query)}`;
        const res = await fetch(`/api/substack-profile?${param}`, { signal: controller.signal });
        const next = res.ok
          ? lookupFromResult(input.kind, { ok: true, data: await res.json() })
          : lookupFromResult(input.kind, { ok: false, status: res.status });
        if (!cancelled) setLookup(next);
      } catch {
        if (!cancelled) setLookup(lookupFromResult(input.kind, { network: true }));
      } finally {
        clearTimeout(giveUp);
      }
    }, input.kind === 'none' ? 0 : 600);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [toName, retry]);

  const onToNameChange = (value) => {
    setToName(value);
    setLookup(classifyInput(value).kind === 'none' ? idleLookup : searchingLookup);
  };
  // "Not them" on a loose match means none of the matches; on a confirmed one it just drops the link
  const rejectMatch = () => setLookup({
    ...idleLookup,
    status: lookup.status === LOOKUP.LINKED ? LOOKUP.DISMISSED : LOOKUP.NONE,
  });

  const recipient = recipientToSave({ typed: toName, lookup });

  const submit = async () => {
    if (!valid || website || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await onGive({
      idx,
      fromName: normalizeHandle(fromName.trim()),
      toName:   recipient.toName || TO_NAME_FALLBACK[toType],
      toType,
      message:  message.trim(),
      color,
    }, { verified: recipient.verified, profile: recipient.profile });
    if (result?.error && result.error !== 'conflict') {
      setSubmitError('Something went wrong — please try again.');
      setSubmitting(false);
    }
  };

  const displayToName   = recipient.toName || TO_NAME_FALLBACK[toType];
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
          <div>
            <h3 className={styles.giveTitle}>Pour a coffee, take a slice</h3>
            <p className={styles.giveSub}>{CONFIG.giveModalSub}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        <label htmlFor="give-message" className={styles.fieldLabel}>{cur.msgLabel}</label>
        <textarea
          id="give-message"
          className={`${styles.input} ${styles.textarea}`}
          value={message}
          rows={3}
          placeholder="Even a short thank-you counts"
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className={styles.charRow}>
          <p className={styles.charError}>{message.length > 1000 ? 'Your message is too long — please trim it to 1000 characters.' : ''}</p>
          <span className={`${styles.charCount} ${message.length > 1000 ? styles.charCountOver : ''}`}>
            {message.length} / 1000
          </span>
        </div>

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
        {showTypes && (
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
                    if (o.value === 'anyone') { setToName(''); setLookup(idleLookup); }
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label htmlFor="give-to" className={styles.fieldLabel}>
          Their name or Substack @handle <span className={styles.opt}>optional</span>
        </label>
        <input
          id="give-to"
          className={styles.input}
          value={toName}
          placeholder={cur.ph}
          maxLength={100}
          onChange={(e) => onToNameChange(e.target.value)}
        />
        <div className={styles.lookupArea} role="status" aria-live="polite">
          {lookup.status === LOOKUP.IDLE && (
            <div className={styles.hint}>
              A Substack <b>@handle</b> (or profile link) becomes a link to their profile.
            </div>
          )}
          {lookup.status === LOOKUP.SEARCHING && <div className={styles.hint}>Looking up profile…</div>}

          {lookup.status === LOOKUP.LINKED && (
            <div className={styles.profileCard}>
              <ProfileBody profile={lookup.profile} />
              <div className={styles.profileStatus}>
                <span className={styles.profileOk}>&#10003; {lookup.profile.name} on Substack</span>
                <button type="button" className={styles.linkBtn} onClick={rejectMatch}>Not them</button>
              </div>
            </div>
          )}

          {lookup.status === LOOKUP.CONFIRM && (
            <div className={styles.profileCard}>
              <ProfileBody profile={lookup.profile} />
              <p className={styles.confirmQ}>Is this who you mean?</p>
              <div className={styles.confirmRow}>
                <button type="button" className="btn-solid btn-solid-sm" onClick={() => setLookup(linkTo(lookup.profile))}>
                  Yes, that&rsquo;s them
                </button>
                <button type="button" className={`btn-ghost ${styles.btnSm}`} onClick={rejectMatch}>Not them</button>
              </div>
              <div className={styles.hint}>Until you confirm, their name won&rsquo;t link to Substack.</div>
            </div>
          )}

          {lookup.status === LOOKUP.CHOOSE && (
            <div className={styles.candidateList}>
              <div className={styles.hint}>A few people go by this name. Who did you mean?</div>
              {lookup.candidates.map((c) => (
                <button
                  key={c.handle}
                  type="button"
                  className={styles.candidateItem}
                  onClick={() => setLookup(linkTo(c))}
                >
                  <Avatar image={c.image} name={c.name} />
                  <div className={styles.profileInfo}>
                    <span className={styles.profileName}>{c.name}</span>
                    {c.description && <span className={styles.profileDesc}>{c.description}</span>}
                  </div>
                </button>
              ))}
              <button type="button" className={styles.candidateNone} onClick={rejectMatch}>None of these</button>
            </div>
          )}

          {lookup.status === LOOKUP.NONE && (
            <div className={styles.hint}>
              Their name won&rsquo;t link to Substack. If you know their <b>@handle</b>, type that instead.
            </div>
          )}

          {lookup.status === LOOKUP.DISMISSED && (
            <div className={styles.hint}>Their name won&rsquo;t link to Substack.</div>
          )}

          {lookup.status === LOOKUP.NOT_FOUND && (
            <div className={styles.lookupWarn}>
              <b>We couldn&rsquo;t find {toName.trim()} on Substack.</b> Your kind word will still name them,
              without a link. Check the spelling if you meant a Substack profile.{' '}
              <a
                href={`https://substack.com/search/${encodeURIComponent(toName.trim().replace(/^@+/, ''))}?searching=profile`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.hintLink}
              >
                Search on Substack &#8599;
              </a>
            </div>
          )}

          {lookup.status === LOOKUP.UNREACHABLE && (
            <div className={styles.lookupWarn}>
              <b>Couldn&rsquo;t reach Substack right now.</b> Your kind word isn&rsquo;t lost. Try again, or keep the name without a link.
              <div className={styles.confirmRow}>
                <button type="button" className="btn-solid btn-solid-sm" onClick={() => setRetry((n) => n + 1)}>Try again</button>
                <button
                  type="button"
                  className={`btn-ghost ${styles.btnSm}`}
                  onClick={() => setLookup({ ...idleLookup, status: LOOKUP.DISMISSED })}
                >
                  Keep without a link
                </button>
              </div>
            </div>
          )}
        </div>

        <label htmlFor="give-from" className={styles.fieldLabel}>
          Signed <span className={styles.opt}>optional</span>
        </label>
        <input
          id="give-from"
          className={styles.input}
          value={fromName}
          placeholder="your name or @handle"
          maxLength={100}
          onChange={(e) => setFromName(e.target.value)}
        />

        <div className={styles.colorRow}>
          <span className={styles.colorSwatch} style={{ background: PASTELS[color % PASTELS.length] }} aria-hidden="true" />
          <span className={styles.colorText}>Icing color for your card</span>
          <button
            type="button"
            className={styles.linkBtn}
            aria-expanded={showColors}
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

        {submitError && (
          <p className={styles.submitError}>{submitError}</p>
        )}
        <div className={styles.giveActions}>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Maybe later</button>
          <button className="btn-solid" disabled={!valid || submitting || lookup.status === LOOKUP.SEARCHING} onClick={submit}>
            {submitting ? 'Taking the slice…' : 'Take the slice'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

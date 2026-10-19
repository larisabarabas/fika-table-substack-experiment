import { LOOKUP } from '../../lib/recipient.js';
import styles from './modals.module.css';

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

// What the Substack lookup found, for one field. `who` is whose profile it is:
// 'them' for the person the word is for, 'you' for the giver's own signature.
// `lookup` is the whole object from useProfileLookup.
export function LookupArea({ lookup: l, typed, who = 'them', onConfirm, onReject, onRetry, onKeep }) {
  const mine = who === 'you';
  const { lookup } = l;
  const noLink = mine ? 'Your name won’t link to Substack.' : 'Their name won’t link to Substack.';

  return (
    <div className={styles.lookupArea} role="status" aria-live="polite">
      {lookup.status === LOOKUP.IDLE && (
        <div className={styles.hint}>
          A Substack <b>@handle</b>, profile link or name becomes a link to {mine ? 'your' : 'their'} profile.
        </div>
      )}
      {lookup.status === LOOKUP.SEARCHING && <div className={styles.hint}>Looking up profile…</div>}

      {lookup.status === LOOKUP.LINKED && (
        <div className={styles.profileCard}>
          <ProfileBody profile={lookup.profile} />
          <div className={styles.profileStatus}>
            <span className={styles.profileOk}>&#10003; {lookup.profile.name} on Substack</span>
            <button type="button" className={styles.linkBtn} onClick={onReject}>{mine ? 'Not me' : 'Not them'}</button>
          </div>
        </div>
      )}

      {lookup.status === LOOKUP.CONFIRM && (
        <div className={styles.profileCard}>
          <ProfileBody profile={lookup.profile} />
          <p className={styles.confirmQ}>{mine ? 'Is this you?' : 'Is this who you mean?'}</p>
          <div className={styles.confirmRow}>
            <button type="button" className="btn-solid btn-solid-sm" onClick={() => onConfirm(lookup.profile)}>
              {mine ? 'Yes, that\u2019s me' : 'Yes, that\u2019s them'}
            </button>
            <button type="button" className={`btn-ghost ${styles.btnSm}`} onClick={onReject}>{mine ? 'Not me' : 'Not them'}</button>
          </div>
          <div className={styles.hint}>Until you confirm, {mine ? 'your' : 'their'} name won&rsquo;t link to Substack.</div>
        </div>
      )}

      {lookup.status === LOOKUP.CHOOSE && (
        <div className={styles.candidateList}>
          <div className={styles.hint}>A few people go by this name. {mine ? 'Which one is you?' : 'Who did you mean?'}</div>
          {lookup.candidates.map((c) => (
            <button key={c.handle} type="button" className={styles.candidateItem} onClick={() => onConfirm(c)}>
              <Avatar image={c.image} name={c.name} />
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{c.name}</span>
                {c.description && <span className={styles.profileDesc}>{c.description}</span>}
              </div>
            </button>
          ))}
          <button type="button" className={styles.candidateNone} onClick={onReject}>None of these</button>
        </div>
      )}

      {lookup.status === LOOKUP.NONE && (
        <div className={styles.hint}>
          {noLink} If you know {mine ? 'your' : 'their'} <b>@handle</b>, type that instead.
        </div>
      )}

      {lookup.status === LOOKUP.DISMISSED && <div className={styles.hint}>{noLink}</div>}

      {lookup.status === LOOKUP.NOT_FOUND && (
        <div className={styles.lookupWarn}>
          <b>We couldn&rsquo;t find {typed.trim()} on Substack.</b>{' '}
          {mine
            ? <>Your name will still be signed as you typed it, without a link. Check the spelling if it is your Substack @handle.</>
            : <>Your kind word will still name them, without a link. Check the spelling if you meant a Substack profile.{' '}
                <a
                  href={`https://substack.com/search/${encodeURIComponent(typed.trim().replace(/^@+/, ''))}?searching=profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.hintLink}
                >
                  Search on Substack &#8599;
                </a>
              </>}
        </div>
      )}

      {lookup.status === LOOKUP.UNREACHABLE && (
        <div className={styles.lookupWarn}>
          <b>Couldn&rsquo;t reach Substack right now.</b> Your kind word isn&rsquo;t lost. Try again, or keep {mine ? 'your' : 'the'} name without a link.
          <div className={styles.confirmRow}>
            <button type="button" className="btn-solid btn-solid-sm" onClick={onRetry}>Try again</button>
            <button type="button" className={`btn-ghost ${styles.btnSm}`} onClick={onKeep}>Keep without a link</button>
          </div>
        </div>
      )}
    </div>
  );
}

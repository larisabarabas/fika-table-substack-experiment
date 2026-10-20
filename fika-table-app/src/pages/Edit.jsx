import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchSlice, updateSlice, deleteSlice } from '../lib/api';
import { rememberSlice, editTokenFor, forgetSlice } from '../lib/ownedSlices';
import { editTimeLeft } from '../lib/editRules';
import { LOOKUP, recipientToSave } from '../lib/recipient';
import { useProfileLookup } from '../hooks/useProfileLookup';
import { LookupArea } from '../components/modals/LookupArea';
import { ShareCard } from '../components/share/ShareCard';
import { Footer } from '../components/Footer';
import { PASTELS } from '../config';
import styles from './Edit.module.css';

// Where a giver changes or deletes their own kind word. Reached from the private link
// (/edit/:id#token) or from this browser's own memory of the token. The person it is
// for can't be changed: it drives the Note link, and a Note may already be posted.
export default function Edit() {
  const { id } = useParams();
  return <EditContent key={id} id={id} />;
}

function EditContent({ id }) {
  const { hash } = useLocation();
  const linkToken = hash.slice(1);
  const token = linkToken || editTokenFor(id);

  const [slice, setSlice] = useState(null);
  const [state, setState] = useState('loading'); // 'loading' | 'missing' | 'ready' | 'deleted'
  const [message, setMessage] = useState('');
  const [fromName, setFromName] = useState('');
  const [color, setColor] = useState(0);
  const [touched, setTouched] = useState(false); // the signature is only looked up once it is edited
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [closed, setClosed] = useState(false);
  const [notice, setNotice] = useState(null); // { tone: 'ok' | 'caution' | 'error', text }

  const fromLookup = useProfileLookup(touched ? fromName : '');

  // A token from the link is kept so this browser can find the slice again
  useEffect(() => {
    if (linkToken) rememberSlice(id, linkToken);
  }, [id, linkToken]);

  useEffect(() => {
    let active = true;
    fetchSlice(id)
      .then((data) => {
        if (!active) return;
        setSlice(data);
        setMessage(data.message);
        setFromName(data.fromName ?? '');
        setColor(data.color);
        setClosed(!editTimeLeft(data.createdAt).open);
        setState('ready');
      })
      .catch(() => { if (active) setState('missing'); });
    return () => { active = false; };
  }, [id]);

  // Private page: keep it out of search results while it is open
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    const before = document.title;
    document.title = 'Edit your kind word';
    return () => { meta.remove(); document.title = before; };
  }, []);

  const signer = recipientToSave({ typed: fromName, lookup: fromLookup.lookup });
  const signedAs = touched ? signer.toName : (slice?.fromName ?? '');
  const msgLen = message.trim().length;
  const valid = msgLen > 1 && msgLen <= 1000;
  const lookingUp = fromLookup.lookup.status === LOOKUP.SEARCHING;
  const changed = !!slice && (
    message.trim() !== slice.message || signedAs !== (slice.fromName ?? '') || color !== slice.color
  );

  const fail = (err) => {
    if (err.reason === 'forbidden') {
      forgetSlice(id);
      setNotice({ tone: 'error', text: 'This link doesn’t match this kind word, so nothing was changed. Use the private link you copied when you gave it.' });
    } else if (err.reason === 'window_closed') {
      setClosed(true);
      setNotice({ tone: 'caution', text: 'The editing window has closed, so this kind word can’t be changed any more. You can still delete it.' });
    } else {
      setNotice({ tone: 'error', text: 'That didn’t go through. Check your connection and try again. Your words are still here.' });
    }
  };

  const save = async () => {
    if (!valid || !changed || busy || lookingUp) return;
    setBusy(true);
    setNotice(null);
    try {
      const updated = await updateSlice({ id, token, message, fromName: signedAs, color });
      setSlice(updated);
      setMessage(updated.message);
      setFromName(updated.fromName ?? '');
      setTouched(false);
      setNotice({ tone: 'ok', text: 'Saved. Your kind word is updated on the table. A Note you already posted on Substack keeps the old words.' });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      await deleteSlice({ id, token });
      forgetSlice(id);
      setState('deleted');
    } catch (err) {
      setConfirming(false);
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const timeLeft = slice ? editTimeLeft(slice.createdAt) : { open: false, label: '' };
  const preview = slice && { ...slice, message, fromName: signedAs || null, color };

  return (
    <div className={styles.page}>
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

        {state === 'missing' && (
          <div className={styles.column}>
            <h1 className={styles.heading}>We couldn&rsquo;t find that kind word</h1>
            <p className={styles.sub}>It may have been deleted already. The table&rsquo;s still set.</p>
            <Link to="/table" className="btn-solid">Back to the table</Link>
          </div>
        )}

        {state === 'deleted' && (
          <div className={styles.column}>
            <h1 className={styles.heading}>Your kind word is gone</h1>
            <p className={styles.sub}>It&rsquo;s off the table, and its slice is free for someone else. A Note you posted on Substack will now lead to a page that can&rsquo;t find it.</p>
            <Link to="/table" className="btn-solid">Back to the table</Link>
          </div>
        )}

        {state === 'ready' && (
          <>
            <h1 className={styles.heading}>Edit your kind word</h1>
            <p className={styles.sub}>
              {closed
                ? 'The editing window has closed. You can still delete it.'
                : `${timeLeft.label}. You can delete it any time.`}
            </p>

            {notice && (
              <div
                role={notice.tone === 'error' ? 'alert' : 'status'}
                className={`${styles.notice} ${styles[`notice_${notice.tone}`]}`}
              >
                {notice.text}
              </div>
            )}

            {!token && (
              <div role="status" className={`${styles.notice} ${styles.notice_caution}`}>
                This browser doesn&rsquo;t have the private link for this kind word. Open the link you copied
                when you gave it. Without it, nothing here can be changed or deleted.
              </div>
            )}

            <ShareCard slice={preview} />

            {!closed && (
              <div className={styles.form}>
                <label htmlFor="edit-message" className={styles.label}>Your kind word</label>
                <textarea
                  id="edit-message"
                  className={`${styles.field} ${styles.textarea}`}
                  value={message}
                  rows={4}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className={styles.charRow}>
                  <span className={message.length > 1000 ? styles.over : ''}>
                    {message.length > 1000 ? 'Too long. Please trim it to 1000 characters.' : ''}
                  </span>
                  <span className={message.length > 1000 ? styles.over : ''}>{message.length} / 1000</span>
                </div>

                <label htmlFor="edit-from" className={styles.label}>
                  Signed <span className={styles.opt}>optional</span>
                </label>
                <input
                  id="edit-from"
                  className={styles.field}
                  value={fromName}
                  maxLength={100}
                  placeholder="your name or @handle"
                  onChange={(e) => { setFromName(e.target.value); setTouched(true); fromLookup.onTyping(e.target.value); }}
                />
                {touched && (
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

                <div className={styles.label} id="edit-color-label">Icing color</div>
                <div className={styles.dots} role="group" aria-labelledby="edit-color-label">
                  {PASTELS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Icing color ${i + 1}`}
                      aria-pressed={color === i}
                      className={`${styles.dot} ${color === i ? styles.dotOn : ''}`}
                      style={{ background: c }}
                      onClick={() => setColor(i)}
                    />
                  ))}
                </div>

                <p className={styles.fixed}>
                  Who it&rsquo;s for can&rsquo;t change. To change that, delete this one and write a new one.
                </p>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className="btn-solid"
                    disabled={!valid || !changed || busy || lookingUp || !token}
                    onClick={save}
                  >
                    {busy && !confirming ? 'Saving…' : 'Save changes'}
                  </button>
                  <Link to="/table" className={styles.back}>Back to the table</Link>
                </div>
              </div>
            )}

            <div className={styles.danger}>
              {!confirming ? (
                <button
                  type="button"
                  className={styles.deleteBtn}
                  disabled={busy || !token}
                  onClick={() => setConfirming(true)}
                >
                  Delete this kind word
                </button>
              ) : (
                <div className={styles.confirm} role="group" aria-label="Confirm delete">
                  <p className={styles.confirmText}>
                    Delete this kind word? It leaves the table for good and its slice is freed. This can&rsquo;t be undone.
                  </p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.deleteSolid} disabled={busy} onClick={remove}>
                      {busy ? 'Deleting…' : 'Yes, delete it'}
                    </button>
                    <button type="button" className="btn-ghost" disabled={busy} onClick={() => setConfirming(false)}>
                      Keep it
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { domToPng } from 'modern-screenshot';
import { SharePoster } from './SharePoster';
import { getShareUrl, getShareText } from '../../lib/shareText';
import styles from './ShareSheet.module.css';

export function ShareSheet({ slice }) {
  const [copiedField, setCopiedField] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);
  const url = getShareUrl(slice.id);
  const text = getShareText(slice);

  const handleNativeShare = useCallback(() => {
    navigator.share({ title: 'Pull up a chair', text, url })
      .catch(() => {/* user cancelled */});
  }, [text, url]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedField('link');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {/* clipboard not available */}
  }, [url]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField('text');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {/* clipboard not available */}
  }, [text]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      await document.fonts.ready;
      const dataUrl = await domToPng(cardRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `fika-slice-${slice.id}.png`;
      link.click();
    } catch {/* capture failed; user can retry */} finally {
      setDownloading(false);
    }
  }, [slice.id, downloading]);

  return (
    <div className={styles.sheet}>
      <p className={styles.label}>Get it</p>
      <div className={styles.actions}>
        <Link
          className={styles.action}
          to={`/share/${slice.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Preview link
        </Link>
        <button className={styles.action} onClick={handleDownload} disabled={downloading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {downloading ? 'Preparing…' : 'Download'}
        </button>
      </div>

      <p className={styles.label}>Send it</p>
      <div className={styles.actions}>
        {'share' in navigator && (
          <button className={styles.action} onClick={handleNativeShare}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
        )}
        <button className={styles.action} onClick={handleCopyLink}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {copiedField === 'link' ? 'Copied!' : 'Copy link'}
        </button>
        <button className={styles.action} onClick={handleCopyText}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          {copiedField === 'text' ? 'Copied!' : 'Copy text'}
        </button>
      </div>

      <div className={styles.captureStage} aria-hidden="true">
        <div ref={cardRef}>
          <SharePoster slice={slice} />
        </div>
      </div>
    </div>
  );
}

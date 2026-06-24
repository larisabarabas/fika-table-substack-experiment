import { useState } from 'react';
import { Overlay } from './Overlay';
import { NameLink } from '../NameLink';
import { PASTELS, TYPE_LABEL } from '../../config';
import { ShareSheet } from '../share/ShareSheet';
import styles from './modals.module.css';

export function ReadModal({ slice, onClose }) {
  const [showShare, setShowShare] = useState(false);

  return (
    <Overlay onClose={onClose} label="Read slice message">
      <div className={styles.frostBand} style={{ background: PASTELS[slice.color % 8] }}>
        <span className={styles.bandNames}>
          <b><NameLink name={slice.fromName} fallback="a guest" /></b>
          {' '}<i className={styles.arrow}>→</i>{' '}
          <NameLink name={slice.toName} fallback="" />
        </span>
      </div>
      <div className={styles.readBody}>
        <p className={styles.readMsg}>{slice.message}</p>
        <div className={styles.readTag}>{TYPE_LABEL[slice.toType]}</div>
        <button className={styles.shareBtn} onClick={() => setShowShare(!showShare)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
      </div>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
      {showShare && <ShareSheet slice={slice} onClose={() => setShowShare(false)} />}
    </Overlay>
  );
}

import { Overlay, CloseIcon } from './Overlay';
import { NameLink } from '../NameLink';
import { PASTELS } from '../../config';
import { ShareSheet } from '../share/ShareSheet';
import styles from './modals.module.css';

export function ReadModal({ slice, onClose }) {
  return (
    <Overlay onClose={onClose} label="Read slice message">
      <span className="frosting" style={{ '--frost': PASTELS[slice.color % 8] }} />
      <div className={styles.readHead}>
        <span className={styles.bandNames}>
          <b><NameLink name={slice.fromName} fallback="a guest" /></b>
          {' '}<span className={styles.arrow}>to</span>{' '}
          <NameLink name={slice.toName} fallback="" />
        </span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close"><CloseIcon /></button>
      </div>
      <div className={styles.readBody}>
        <p className={styles.readMsg}>{slice.message}</p>
      </div>
      <ShareSheet slice={slice} />
    </Overlay>
  );
}

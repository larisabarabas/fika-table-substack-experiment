import { Overlay } from './Overlay';
import { NameLink } from '../NameLink';
import { PASTELS, TYPE_LABEL } from '../../config';
import styles from './modals.module.css';

export function ReadModal({ slice, onClose }) {
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
      </div>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
    </Overlay>
  );
}

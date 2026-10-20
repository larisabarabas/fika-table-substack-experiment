import { Overlay, CloseIcon } from './Overlay';
import { NameLink } from '../NameLink';
import { PASTELS } from '../../config';
import { ShareSheet } from '../share/ShareSheet';
import { formatDay } from '../../lib/dates.js';
import styles from './modals.module.css';

// onEdit is passed only for a slice this browser gave: it opens the give form filled in
export function ReadModal({ slice, onClose, onEdit }) {
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
        {slice.editedAt && <p className={styles.hint}>Edited {formatDay(slice.editedAt)}</p>}
        {onEdit && (
          <p className={styles.hint}>
            <button type="button" className={styles.linkBtn} onClick={() => onEdit(slice)}>Edit or delete your slice</button>
          </p>
        )}
      </div>
      <ShareSheet slice={slice} />
    </Overlay>
  );
}

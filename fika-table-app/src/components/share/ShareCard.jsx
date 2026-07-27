import { PASTELS, TYPE_LABEL } from '../../config';
import styles from './ShareCard.module.css';

export function ShareCard({
  slice,
  fromLineClassName = '',
  messageClassName = '',
  tagClassName = '',
  children,
}) {
  return (
    <div className={styles.card} style={{ '--foam': PASTELS[slice.color % 8] }}>
      <span className={styles.quoteMark} aria-hidden="true">&ldquo;</span>
      <svg className={styles.steam} viewBox="0 0 40 34" aria-hidden="true">
        <path d="M10 32 q-6 -8 0 -15 q6 -7 0 -14" />
        <path d="M20 32 q6 -8 0 -15 q-6 -7 0 -14" />
        <path d="M30 32 q-6 -8 0 -15 q6 -7 0 -14" />
      </svg>
      <div className={styles.cardInner}>
        <p className={`${styles.fromLine} ${fromLineClassName}`}>
          From <span className={styles.fromLineNm}>{slice.fromName || 'a guest'}</span>
          &nbsp;&middot; on this week&rsquo;s cake
        </p>
        <p className={`${styles.message} ${messageClassName}`}>
          {slice.message}
        </p>
        <div className={`${styles.typeTag} ${tagClassName}`}>
          {TYPE_LABEL[slice.toType]}
        </div>
        {children}
      </div>
    </div>
  );
}

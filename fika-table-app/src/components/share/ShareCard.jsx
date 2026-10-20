import { PASTELS, TO_NAME_FALLBACK } from '../../config';
import { RE_MULTI_AT } from '../../lib/substack';
import { formatDay } from '../../lib/dates.js';
import styles from './ShareCard.module.css';

export function ShareCard({
  slice,
  fromLineClassName = '',
  messageClassName = '',
  tagClassName = '',
  children,
}) {
  const day = formatDay(slice.createdAt);
  const toName = slice.toName?.replace(RE_MULTI_AT, '@') || TO_NAME_FALLBACK[slice.toType] || 'the table';

  return (
    <div className={styles.card}>
      <span className="frosting" style={{ '--frost': PASTELS[slice.color % 8] }} />
      <div className={styles.cardInner}>
        <p className={`${styles.to} ${tagClassName}`}>
          For <span className={styles.toNm}>{toName}</span>
        </p>
        <p className={`${styles.message} ${messageClassName}`}>
          {slice.message}
        </p>
        <p className={`${styles.fromLine} ${fromLineClassName}`}>
          from <span className={styles.fromLineNm}>{slice.fromName || 'a guest'}</span>{day && `, ${day}`}{slice.editedAt && ' · edited'}
        </p>
        {children}
      </div>
    </div>
  );
}

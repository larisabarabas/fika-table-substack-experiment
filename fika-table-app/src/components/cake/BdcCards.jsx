import { memo } from 'react';
import { NameSpan } from '../BdcName';
import { PASTELS, TYPE_LABEL } from '../../config';
import styles from './BdcCards.module.css';

function BdcCards({ count, filled, onSlice }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => {
        const s = filled[i];

        if (!s) {
          return (
            <button key={i} className={styles.cardEmpty} onClick={() => onSlice(i)}>
              <span className={styles.plus}>+</span>
              <span className={styles.take}>Cut this slice</span>
            </button>
          );
        }

        return (
          <button key={i} className={styles.cardFull} onClick={() => onSlice(i)}>
            <span className={styles.frost} style={{ background: PASTELS[s.color % 8] }} />
            <span className={styles.names}>
              <b><NameSpan name={s.fromName} fallback="a guest" /></b>
              <i className={styles.arrow}>→</i>
              <NameSpan name={s.toName} fallback="" />
            </span>
            <span className={styles.message}>{s.message}</span>
            <span className={styles.tag}>{TYPE_LABEL[s.toType]}</span>
          </button>
        );
      })}
    </div>
  );
}

export default memo(BdcCards);

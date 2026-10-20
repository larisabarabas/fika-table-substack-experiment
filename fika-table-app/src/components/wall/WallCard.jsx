import { memo, useCallback } from 'react';
import { NameSpan } from '../NameLink';
import { PASTELS } from '../../config';
import styles from './wall.module.css';

function WallCard({ slice, onRead, landed, mine }) {
  const handleClick = useCallback(() => onRead(slice), [onRead, slice]);
  return (
    <button className={`${styles.card} ${landed ? styles.landed : ''}`} onClick={handleClick}>
      <span className="frosting" style={{ '--frost': PASTELS[slice.color % 8] }} />
      <span className={styles.names}>
        <b><NameSpan name={slice.fromName} fallback="a guest" /></b>
        <span className={styles.arrow}>to</span>
        <NameSpan name={slice.toName} fallback="" />
      </span>
      <span className={styles.message}>{slice.message}</span>
      {mine && <span className={styles.mine}>Yours</span>}
    </button>
  );
}

export default memo(WallCard);

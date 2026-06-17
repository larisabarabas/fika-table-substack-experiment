import { memo } from 'react';
import { NameSpan } from '../BdcName';
import { PASTELS, TYPE_LABEL } from '../../config';
import styles from './wall.module.css';

function WallCard({ slice, onClick }) {
  return (
    <button className={styles.card} onClick={onClick}>
      <span className={styles.frost} style={{ background: PASTELS[slice.color % 8] }} />
      <span className={styles.names}>
        <b><NameSpan name={slice.fromName} fallback="a guest" /></b>
        <i className={styles.arrow}>→</i>
        <NameSpan name={slice.toName} fallback="" />
      </span>
      <span className={styles.message}>{slice.message}</span>
      <span className={styles.tag}>{TYPE_LABEL[slice.toType]}</span>
    </button>
  );
}

export default memo(WallCard);

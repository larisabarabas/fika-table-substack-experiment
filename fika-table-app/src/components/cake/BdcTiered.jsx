import { memo } from 'react';
import { BdcFlame } from '../BdcFlame';
import { PASTELS } from '../../config';
import styles from './BdcTiered.module.css';

const TIERS = [
  { w: 100, colorIdx: 0 },
  { w: 78,  colorIdx: 3 },
  { w: 56,  colorIdx: 5 },
];

function BdcTiered({ count, filled, onSlice }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.candleRow} role="list">
        {Array.from({ length: count }).map((_, i) => {
          const s = filled[i];
          return (
            <button
              key={i}
              className={styles.candle}
              style={{ '--stick-color': PASTELS[i % 8] }}
              onClick={() => onSlice(i)}
              title={s ? `${s.fromName || 'a guest'} → ${s.toName}` : 'Light a candle — cut a slice'}
              role="listitem"
            >
              <BdcFlame lit={!!s} size={0.85} igniteDelay={0} />
              <span className={styles.stick} />
            </button>
          );
        })}
      </div>

      <div className={styles.cakeBody}>
        {TIERS.map((t, ti) => (
          <div
            key={ti}
            className={styles.tier}
            style={{ width: t.w + '%', background: PASTELS[t.colorIdx] }}
          >
            <div className={styles.drip} />
            <div className={styles.dots}>
              {Array.from({ length: 7 }).map((_, d) => <i key={d} className={styles.dot} />)}
            </div>
          </div>
        ))}
        <div className={styles.plate} />
      </div>

      <p className={styles.hint}>
        Every lit candle is a slice that's been cut. Tap an unlit one to cut yours.
      </p>
    </div>
  );
}

export default memo(BdcTiered);

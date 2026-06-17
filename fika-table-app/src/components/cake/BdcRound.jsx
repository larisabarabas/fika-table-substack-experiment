import { useState, memo } from 'react';
import { BdcFlame } from '../BdcFlame';
import { PASTELS, CONFIG } from '../../config';
import styles from './BdcRound.module.css';

const SZ = 600, CX = 300, CY = 300, RO = 272, MED = 116;
const MINI_COLORS = [PASTELS[0], PASTELS[3], PASTELS[5]];

function polar(cx, cy, r, deg) {
  const t = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
}

function wedgePath(r, a0, a1) {
  const [x0, y0] = polar(CX, CY, r, a0);
  const [x1, y1] = polar(CX, CY, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
}

function BdcRound({ count, filled, sharedCount, onSlice }) {
  const [hover, setHover] = useState(-1);
  const step = 360 / count;

  return (
    <div className={styles.wrap}>
      {/* div wrapper for hardware-accelerated SVG transforms */}
      <div className={styles.svgWrap}>
        <svg
          viewBox={`0 0 ${SZ} ${SZ}`}
          className={styles.svg}
          role="img"
          aria-label={`Birthday cake, ${sharedCount} of ${count} slices cut`}
        >
          <defs>
            <filter id="plateShad" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.10" />
            </filter>
          </defs>

          <circle cx={CX} cy={CY} r={RO + 18} fill="var(--panel)" filter="url(#plateShad)" />
          <circle cx={CX} cy={CY} r={RO + 18} fill="none" stroke="var(--edge)" strokeWidth="1" />

          {Array.from({ length: count }).map((_, i) => {
            const a0  = i * step + 0.7;
            const a1  = (i + 1) * step - 0.7;
            const s   = filled[i];
            const mid = (i + 0.5) * step;
            const [dx, dy] = polar(0, 0, hover === i ? 12 : 0, mid);
            const fill = s ? PASTELS[s.color % 8] : 'rgba(52,48,42,0.035)';
            const [lx, ly] = polar(CX, CY, RO * 0.72, mid);

            return (
              <g
                key={i}
                className={styles.wedge}
                style={{ transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)` }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(-1)}
                onClick={() => onSlice(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSlice(i)}
                aria-label={s ? `${s.fromName || 'a guest'} → ${s.toName}: ${s.message}` : `Cut slice ${i + 1}`}
              >
                <path
                  d={wedgePath(RO, a0, a1)}
                  fill={fill}
                  stroke="var(--paper)"
                  strokeWidth="3.5"
                  strokeDasharray={s ? 'none' : '2 5'}
                />
                {s !== undefined && s !== null && (
                  <circle cx={lx} cy={ly} r="6.5" fill="var(--paper)" opacity="0.85" />
                )}
                {!s && hover === i && (
                  <text x={lx} y={ly + 5} textAnchor="middle" fontSize="22" fill="var(--sub)" fontWeight="700">+</text>
                )}
              </g>
            );
          })}

          <circle cx={CX} cy={CY} r={MED}     fill="var(--panel)" stroke="var(--edge)"   strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r={MED - 9} fill="none"         stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 7" opacity="0.6" />
        </svg>
      </div>

      {/* HTML medallion overlay — real fonts, real candles */}
      <div className={styles.medallion} aria-hidden="true">
        <div className={styles.miniCandles}>
          {MINI_COLORS.map((color, k) => (
            <span key={k} className={styles.miniCandle}>
              <BdcFlame lit size={0.75} igniteDelay={0} />
              <span className={styles.miniStick} style={{ background: color }} />
            </span>
          ))}
        </div>
        <div className={styles.age}>{CONFIG.age}</div>
        <div className={styles.ageSub}>
          {sharedCount === 0 ? 'the first slice is yours' : `${sharedCount} of ${count} slices cut`}
        </div>
      </div>
    </div>
  );
}

export default memo(BdcRound);

import { memo } from 'react';
import { PASTELS } from '../../config';
import styles from './CakeRound.module.css';

const SZ = 600, CX = 300, CY = 300, RO = 272, MED = 116;

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

// A status glyph, not a picker — too small at rail/mobile widths for reliable
// wedge taps, so it's decorative only; "Take a slice" (the button beside it)
// and the wall cards are the real take/read affordances.
function CakeRound({ count, filled, sharedCount, holdIdx, liftIdx }) {
  const step = 360 / count;

  return (
    <div className={styles.wrap}>
      <div className={styles.svgWrap}>
        <svg
          viewBox={`0 0 ${SZ} ${SZ}`}
          className={styles.svg}
          role="img"
          aria-label={`This week's cake — ${sharedCount} of ${count} slices taken`}
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
            // holdIdx: a slice just given whose modal is still open stays on the cake
            const s   = holdIdx === i ? undefined : filled[i];
            const mid = (i + 0.5) * step;
            const [lx, ly] = polar(CX, CY, RO * 0.72, mid);
            const [cx2, cy2] = polar(CX, CY, RO * 0.58, mid + step * 0.18);
            const lifting = s && liftIdx === i;
            const [dx, dy] = polar(0, 0, 70, mid);
            const wedge = (
              <path
                d={wedgePath(RO, a0, a1)}
                fill="var(--accent-fill)"
                stroke="var(--paper)"
                strokeWidth="3.5"
              />
            );

            // Slices still on the cake are cake; a taken slice leaves its outline
            // on the plate and a crumb in the giver's foam colour.
            return s ? (
              <g key={i}>
                <path
                  d={wedgePath(RO, a0, a1)}
                  fill="none"
                  stroke="var(--edge)"
                  strokeWidth="2"
                  strokeDasharray="2 6"
                />
                <g className={lifting ? styles.crumbs : undefined}>
                  <circle cx={lx} cy={ly} r="14" fill={PASTELS[s.color % 8]} />
                  <circle cx={cx2} cy={cy2} r="6" fill={PASTELS[s.color % 8]} />
                </g>
                {lifting && (
                  <g className={styles.lift} style={{ '--dx': `${dx}px`, '--dy': `${dy}px` }}>
                    {wedge}
                  </g>
                )}
              </g>
            ) : (
              <g key={i}>
                {wedge}
                <circle cx={lx} cy={ly} r="6.5" fill="var(--accent)" opacity="0.7" />
              </g>
            );
          })}

          <circle cx={CX} cy={CY} r={MED}     fill="var(--panel)" stroke="var(--edge)"   strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r={MED - 9} fill="none"         stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 7" opacity="0.6" />
        </svg>
      </div>

      {/* HTML medallion overlay — real fonts, same tarta illustration as Welcome */}
      <div className={styles.medallion} aria-hidden="true">
        <img src="/illustrations/Prinsesstarta.svg" alt="" className={styles.medTarta} />
        <div className={styles.medSub}>
          <b>{sharedCount}</b>/{count}
        </div>
      </div>
    </div>
  );
}

export default memo(CakeRound);

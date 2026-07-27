import { useState, memo } from 'react';
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

const MEDALLION_SVG = (
  <svg className={styles.medCake} viewBox="115 100 130 80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="roughMed" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    <g className="medFills" transform="translate(1.5 1.8) rotate(-0.5 180 150)">
      <ellipse className="medStand" cx="180" cy="166" rx="60" ry="10" />
      <path className="medCake" d="M138 118 Q180 130 222 118 L222 150 Q180 162 138 150 Z" />
      <ellipse className="medFrost" cx="180" cy="118" rx="42" ry="9" />
    </g>
    <g className="medLines" filter="url(#roughMed)">
      <ellipse cx="180" cy="165" rx="62" ry="10" />
      <path d="M138 150 Q180 162 222 150" />
      <path d="M138 150 L138 119" />
      <path d="M222 150 L222 119" />
      <ellipse cx="180" cy="118" rx="42" ry="9" />
      <path d="M139 121 q8 11 16 0 q8 11 16 0 q8 11 16 0 q8 11 16 0 q8 11 16 0" />
      <circle cx="166" cy="111" r="4" />
      <circle cx="181" cy="114" r="4.5" />
      <circle cx="196" cy="111" r="4" />
      <path d="M181 109 q3 -5 6 -3" />
    </g>
  </svg>
);

function CakeRound({ count, filled, sharedCount, onSlice }) {
  const [hover, setHover] = useState(-1);
  const step = 360 / count;

  return (
    <div className={styles.wrap}>
      <div className={styles.svgWrap}>
        <svg
          viewBox={`0 0 ${SZ} ${SZ}`}
          className={styles.svg}
          role="img"
          aria-label={`This week's cake — ${count} slices, ${sharedCount} taken`}
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
                aria-label={s ? `${s.fromName || 'a guest'} → ${s.toName}: ${s.message}` : `Take slice ${i + 1}`}
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

      {/* HTML medallion overlay — real fonts, mini fika scene */}
      <div className={styles.medallion} aria-hidden="true">
        {MEDALLION_SVG}
        <div className={styles.medFika}>fika</div>
        <div className={styles.medSub}>
          {sharedCount === 0 ? 'the first slice is yours' : `${sharedCount} of ${count} taken`}
        </div>
      </div>
    </div>
  );
}

export default memo(CakeRound);

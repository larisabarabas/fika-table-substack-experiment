import { Link } from 'react-router-dom';
import { CONFIG } from '../config';
import styles from './Welcome.module.css';

export default function Welcome() {
  return (
    <div className={styles.page}>
      <main className={styles.wrap}>
        <p className="eyebrow">{CONFIG.welcomeEyebrow}</p>

        <div className={styles.scene} aria-hidden="true">
          <svg className={styles.sceneSvg} viewBox="0 0 360 272" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="rough" x="-12%" y="-12%" width="124%" height="124%">
                <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="7" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>

            <g className="fills" transform="translate(2.4 2.6) rotate(-0.5 180 180)">
              <ellipse className="f-stand" cx="180" cy="166" rx="60" ry="10" />
              <ellipse className="f-stand" cx="180" cy="207" rx="29" ry="6" />
              <path className="f-cake" d="M138 118 Q180 130 222 118 L222 150 Q180 162 138 150 Z" />
              <ellipse className="f-frost" cx="180" cy="118" rx="42" ry="9" />
              <ellipse className="f-saucer" cx="92" cy="204" rx="34" ry="6" />
              <path className="f-cup" d="M67 170 C69 186 74 197 92 199 C110 197 115 186 117 170 Q92 180 67 170 Z" />
              <ellipse className="f-saucer" cx="272" cy="206" rx="48" ry="8" />
              <path className="f-slice" d="M244 203 L298 203 L298 168 Z" />
            </g>

            <g className="lines" filter="url(#rough)">
              <path d="M22 214 Q180 224 338 214" />
              <ellipse cx="180" cy="207" rx="30" ry="6" />
              <path d="M168 205 C170 190 170 180 173 169" />
              <path d="M192 205 C190 190 190 180 187 169" />
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
              <ellipse cx="92" cy="170" rx="25" ry="6.5" />
              <ellipse cx="92" cy="170" rx="19" ry="4.6" />
              <path d="M67 170 C69 186 74 197 92 199 C110 197 115 186 117 170" />
              <path d="M118 176 C135 174 135 193 113 192" />
              <ellipse cx="92" cy="204" rx="34" ry="6" />
              <path className="steam s1" d="M85 158 q-7 -9 0 -18 q7 -8 0 -17" />
              <path className="steam s2" d="M100 158 q7 -9 0 -18 q-7 -8 0 -17" />
              <ellipse cx="272" cy="206" rx="48" ry="8" />
              <path d="M244 203 L298 203 L298 168 Z" />
              <path d="M246 200 L298 167" />
              <path d="M262 192 L298 192" />
              <path d="M277 182 L298 182" />
              <circle cx="291" cy="163" r="4" />
            </g>
          </svg>
        </div>

        <h1 className={styles.headline}>
          <span>{CONFIG.welcomeHeadline[0]}</span>
          <em>{CONFIG.welcomeHeadline[1]}</em>
        </h1>

        {CONFIG.welcomeLede.map((paragraph, i) => (
          <p key={i} className={styles.lede}>{paragraph}</p>
        ))}

        <div className="tagline-pill">{CONFIG.dateRange}</div>

        <div className={styles.actions}>
          <Link to="/cake?give=1" className="btn-solid">
            {CONFIG.welcomeCTA} <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
          <Link to="/cake" className="btn-ghost">
            {CONFIG.welcomeGhostCTA}
          </Link>
        </div>

        <p className={styles.fineprint}>{CONFIG.welcomeFineprint}</p>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerScript}>{CONFIG.footerScript}</p>
        <p className={styles.footerSub}>
          <a href={CONFIG.substackUrl} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
            {CONFIG.newsletter}
          </a>
          <span className={styles.footerSep}>&middot;</span>
          <Link to="/privacy" className={styles.footerLink}>Privacy</Link>
        </p>
      </footer>
    </div>
  );
}

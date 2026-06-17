import { Link } from 'react-router-dom';
import { CONFIG } from '../config';
import { BdcFlame } from '../components/BdcFlame';
import styles from './Welcome.module.css';

const CANDLES = [
  { height: 64, color: 'var(--accent)',  delay: 0.25 },
  { height: 82, color: '#e9c46a',        delay: 0.55 },
  { height: 58, color: '#a7c4a0',        delay: 0.85 },
];

function Candle({ height, color, delay }) {
  return (
    <div className={styles.candle}>
      <BdcFlame lit igniteDelay={delay} />
      <span className={styles.stick} style={{ height, background: color }} />
    </div>
  );
}

export default function Welcome() {
  return (
    <div className={styles.page}>
      <main className={styles.wrap}>
        <span className="eyebrow">{CONFIG.welcomeEyebrow}</span>

        <div className={styles.candles}>
          {CANDLES.map((c, i) => (
            <Candle key={i} {...c} />
          ))}
        </div>

        <h1 className={styles.headline}>
          <span>{CONFIG.welcomeHeadline[0]}</span>
          <em>{CONFIG.welcomeHeadline[1]}</em>
        </h1>

        <p className={styles.lede}>{CONFIG.welcomeLede}</p>

        <div className="date-pill">{CONFIG.dateRange}</div>

        <div className={styles.actions}>
          <Link to="/cake?give=1" className="btn-solid">
            Cut yourself a slice →
          </Link>
          <Link to="/cake" className="btn-ghost">
            Have a look at the table first
          </Link>
        </div>

        <p className={styles.fineprint}>{CONFIG.welcomeFineprint}</p>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerScript}>with love, {CONFIG.hostName}</span>
        <span className={styles.footerSub}>{CONFIG.newsletter}</span>
      </footer>
    </div>
  );
}

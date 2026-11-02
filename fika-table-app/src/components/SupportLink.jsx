import { CONFIG } from '../config';
import styles from './SupportLink.module.css';

// The host's "buy me a coffee" link, sitting in the footer's row of small links, never a button: the app
// is about kind words between readers, so asking for money stays in the background.
export function SupportLink({ className = '' }) {
  return (
    <a href={CONFIG.supportURL} target="_blank" rel="noopener noreferrer" className={`${styles.link} ${className}`}>
      {CONFIG.supportText}
      <span className={styles.hidden}>, opens in a new tab</span>
    </a>
  );
}

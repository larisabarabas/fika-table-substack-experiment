import { Link } from 'react-router-dom';
import { CONFIG } from '../config';
import styles from './Footer.module.css';

// Shared page footer — script tagline + a sub-line. Table/Share use the
// default sub-line (tagline text + Privacy link); pages with a different
// sub-line (e.g. Welcome's creator + Privacy links) pass their own as
// children. `className`/`scriptClassName` let a page adjust outer layout
// (e.g. position/z-index above a background) or the tagline size without
// forking the component.
export function Footer({ className = '', scriptClassName = '', children, ...rest }) {
  return (
    <footer className={`${styles.footer} ${className}`} {...rest}>
      <p className={`${styles.footerScript} ${scriptClassName}`}>{CONFIG.footerScript}</p>
      {children ?? (
        <>
          <p className={styles.footerSub}>{CONFIG.footerSub}</p>
          <p className={styles.footerPriv}><Link to="/privacy">Privacy</Link></p>
        </>
      )}
    </footer>
  );
}

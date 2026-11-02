import { Link } from 'react-router-dom';
import { CONFIG } from '../config';
import { SupportLink } from './SupportLink';
import styles from './Footer.module.css';

// Shared page footer — script tagline + a sub-line. Table/Share use the
// default sub-line (tagline text + Privacy link); pages with a different
// sub-line (e.g. Welcome's creator + Privacy links) pass their own as
// children. `className`/`scriptClassName` let a page adjust outer layout
// (e.g. position/z-index above a background) or the tagline size without
// forking the component. `support={false}` leaves out the coffee link, for pages
// a recipient lands on after being given a kind word.
export function Footer({ className = '', scriptClassName = '', support = true, children, ...rest }) {
  return (
    <footer className={`${styles.footer} ${className}`} {...rest}>
      <p className={`${styles.footerScript} ${scriptClassName}`}>{CONFIG.footerScript}</p>
      {children ?? (
        <>
          <p className={styles.footerSub}>{CONFIG.footerSub}</p>
          <p className={styles.footerPriv}>
            <Link to="/privacy">Privacy</Link>
            {support && <SupportLink />}
          </p>
        </>
      )}
    </footer>
  );
}

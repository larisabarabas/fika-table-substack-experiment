import { parseSubstackUrl, RE_MULTI_AT } from '../../lib/substack';
import { CONFIG } from '../../config';
import { ShareCard } from './ShareCard';
import styles from './SharePoster.module.css';

export function SharePoster({ slice }) {
  const subUrl = parseSubstackUrl(slice.toName);
  const displayName = slice.toName?.replace(RE_MULTI_AT, '@') ?? '';

  return (
    <div className={styles.poster}>
      <div className={styles.brand}>
        <img src="/illustrations/Fika_logo_text.svg" alt="" className={styles.logo} />
        <span className={styles.brandPub}>for {CONFIG.newsletter}</span>
      </div>

      <div className={styles.cardWrap}>
        <ShareCard slice={slice} />
      </div>

      {/* An image can't be clicked, so these are plain lines, not buttons */}
      <div className={styles.pitch}>
        <p className={styles.pitchMain}>
          Send a kind word at <b>{CONFIG.siteHost}</b>
        </p>
        {subUrl && <p className={styles.pitchSub}>Find {displayName} on Substack</p>}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerScript}>{CONFIG.footerScript}</span>
        <span className={styles.footerSub}>{CONFIG.footerSub}</span>
      </div>
    </div>
  );
}

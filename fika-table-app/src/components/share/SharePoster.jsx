import { parseSubstackUrl, RE_MULTI_AT } from '../../lib/substack';
import { CONFIG } from '../../config';
import { ShareCard } from './ShareCard';
import shareStyles from '../../pages/Share.module.css';
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
        <ShareCard slice={slice}>
          <div className={shareStyles.actions}>
            <span className={shareStyles.cta}>Send your kind word</span>
            {subUrl && (
              <span className={shareStyles.subscribe}>
                Subscribe to <span className={shareStyles.subscribeNm}>{displayName}</span>
                <span className={shareStyles.subscribeArr}>&#8599;</span>
              </span>
            )}
          </div>
        </ShareCard>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerScript}>{CONFIG.footerScript}</span>
        <span className={styles.footerSub}>{CONFIG.footerSub}</span>
      </div>
    </div>
  );
}

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
      <div className={shareStyles.brand}>
        <span className={shareStyles.brandMark}>Substack FIKA</span>
        <span className={shareStyles.brandPub}>
          for <span className={shareStyles.brandPubNm}>{CONFIG.newsletter}</span>
        </span>
      </div>

      <div className={styles.cardWrap}>
        <ShareCard slice={slice}>
          <div className={shareStyles.actions}>
            <span className={shareStyles.cta}>
              Pass a slice to someone <span className={shareStyles.ctaArr}>&rarr;</span>
            </span>
            {subUrl && (
              <span className={shareStyles.subscribe}>
                Subscribe to <span className={shareStyles.subscribeNm}>{displayName}</span>
                <span className={shareStyles.subscribeArr}>&#8599;</span>
              </span>
            )}
          </div>
        </ShareCard>
      </div>

      <div className={shareStyles.footer}>
        <span className={shareStyles.footerScript}>{CONFIG.footerScript}</span>
        <span className={shareStyles.footerSub}>{CONFIG.footerSub}</span>
      </div>
    </div>
  );
}

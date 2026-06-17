import styles from './BdcFlame.module.css';

export function BdcFlame({ lit, size = 1, igniteDelay = 0 }) {
  if (!lit) {
    return <span className={styles.wick} style={{ height: 6 * size + 'px' }} />;
  }

  return (
    <span className={styles.flame} style={{ '--fsz': size, '--delay': igniteDelay + 's' }}>
      <span className={styles.glow} />
      <span className={styles.body} />
    </span>
  );
}

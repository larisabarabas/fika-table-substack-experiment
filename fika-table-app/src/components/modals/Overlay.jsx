import { useEffect } from 'react';
import styles from './modals.module.css';

export function Overlay({ onClose, wide, label, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={label}>
      <div
        className={`${styles.modal} ${wide ? styles.modalWide : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

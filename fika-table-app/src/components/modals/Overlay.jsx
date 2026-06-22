import { useEffect, useRef } from 'react';
import styles from './modals.module.css';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Overlay({ onClose, wide, label, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const modal = modalRef.current;

    const firstFocusable = modal?.querySelector(FOCUSABLE);
    (firstFocusable ?? modal)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !modal) return;

      const focusable = [...modal.querySelectorAll(FOCUSABLE)];
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={label}>
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`${styles.modal} ${wide ? styles.modalWide : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import styles from './modals.module.css';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Only what a person can actually reach: skips tabindex="-1" fields and anything
// inside an aria-hidden wrapper (the give form's spam honeypot is both).
const focusableIn = (modal) =>
  [...modal.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.tabIndex >= 0 && !el.disabled && !el.closest('[aria-hidden="true"]')
  );

export function Overlay({ onClose, wide, label, children }) {
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const modal = modalRef.current;

    const firstFocusable = modal ? focusableIn(modal)[0] : null;
    (firstFocusable ?? modal)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !modal) return;

      const focusable = focusableIn(modal);
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
  }, []);

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

// Same glyph everywhere (the unicode ✕ renders differently per OS).
export function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

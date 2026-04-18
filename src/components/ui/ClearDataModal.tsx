import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import styles from './ClearDataModal.module.css';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ClearDataModal({
  isOpen,
  onClose,
  onConfirm,
}: ClearDataModalProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = '';
      };
    }

    return undefined;
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-data-modal-title"
        >
          <motion.div
            className={styles.card}
            initial={prefersReducedMotion ? false : { scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : { type: 'spring', stiffness: 320, damping: 28 }
            }
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.hero}>
              <span className={styles.icon} aria-hidden="true">
                🗑️
              </span>
              <div className={styles.heroText}>
                <p className={styles.eyebrow}>Operacja nieodwracalna</p>
                <h2 id="clear-data-modal-title" className={styles.title}>
                  Usuń wszystkie dane z urządzenia
                </h2>
              </div>
            </div>

            <p className={styles.description}>
              Ta operacja usunie lokalnie zapisane dane Clickido i przywróci aplikację do stanu
              pierwszego uruchomienia.
            </p>

            <div className={styles.content}>
              <p className={styles.contentTitle}>Zostaną usunięte:</p>
              <ul className={styles.list}>
                <li>zadania i historia wykonania</li>
                <li>nagrody i historia odbierania</li>
                <li>ustawienia aplikacji i onboarding</li>
              </ul>
              <p className={styles.note}>
                Usuwane są tylko dane zapisane lokalnie na tym urządzeniu. Operacji nie da się
                cofnąć.
              </p>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.submitButton} onClick={onConfirm}>
                Potwierdź usunięcie
              </button>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                Anuluj
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

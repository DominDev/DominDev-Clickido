/**
 * ParentPinModal - Modal for creating or changing parent PIN
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import styles from './ParentPinModal.module.css';

interface ParentPinModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (pin: string) => { success: boolean; error?: string };
}

export default function ParentPinModal({
  isOpen,
  title,
  description,
  submitLabel = 'Zapisz PIN',
  onClose,
  onSubmit,
}: ParentPinModalProps) {
  const [pinValue, setPinValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }

    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPinValue('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const result = onSubmit(pinValue.trim());

    if (!result.success) {
      setError(result.error ?? 'Nie udało się zapisać PIN-u.');
      setPinValue('');
      inputRef.current?.focus();
      return;
    }

    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

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
          aria-labelledby="parent-pin-modal-title"
        >
          <motion.div
            className={styles.card}
            initial={prefersReducedMotion ? false : { scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : { type: 'spring', stiffness: 320, damping: 28 }
            }
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.hero}>
              <span className={styles.icon} aria-hidden="true">
                🔐
              </span>
              <div className={styles.heroText}>
                <p className={styles.eyebrow}>Zabezpieczenie rodzica</p>
                <h2 id="parent-pin-modal-title" className={styles.title}>
                  {title}
                </h2>
              </div>
            </div>

            {description && <p className={styles.description}>{description}</p>}

            <label className={styles.inputField}>
              <span className={styles.inputLabel}>PIN rodzica</span>
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={4}
                className={styles.input}
                value={pinValue}
                onChange={(event) => {
                  setPinValue(event.target.value.replace(/\D/g, '').slice(0, 4));
                  if (error) {
                    setError(null);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="1234"
              />
            </label>

            <p className={styles.inputHint}>Użyj 4 cyfr. Ten PIN chroni wyjście z trybu dziecięcego.</p>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button type="button" className={styles.submitButton} onClick={handleSubmit}>
                {submitLabel}
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

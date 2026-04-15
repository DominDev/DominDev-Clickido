/**
 * PinModal - Fullscreen modal for PIN verification
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import styles from './PinModal.module.css';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => boolean;
  title: string;
  description?: string;
  submitLabel?: string;
}

export default function PinModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  submitLabel = 'Potwierdź',
}: PinModalProps) {
  const [pinValue, setPinValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus input after animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setPinValue('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const success = onSubmit(pinValue.trim());
    if (!success) {
      setError('Nieprawidłowy PIN rodzica.');
      setPinValue('');
      inputRef.current?.focus();
    }
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
          aria-labelledby="pin-modal-title"
        >
          <motion.div
            className={styles.card}
            initial={prefersReducedMotion ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : { type: 'spring', stiffness: 300, damping: 25 }
            }
            onClick={(e) => e.stopPropagation()}
          >
            <span className={styles.icon} aria-hidden="true">
              🔒
            </span>

            <h2 id="pin-modal-title" className={styles.title}>
              {title}
            </h2>

            {description && <p className={styles.description}>{description}</p>}

            <label className={styles.inputLabel}>
              <span className={styles.inputLabelText}>PIN rodzica</span>
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={4}
                className={styles.input}
                value={pinValue}
                onChange={(e) => {
                  setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4));
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="• • • •"
                aria-describedby={error ? 'pin-error' : undefined}
              />
            </label>

            {error && (
              <p id="pin-error" className={styles.error}>
                {error}
              </p>
            )}

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

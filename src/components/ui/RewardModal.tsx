/**
 * RewardModal - Modal for creating/editing custom rewards
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CustomReward, RewardAudience } from '@/types';
import styles from './RewardModal.module.css';

// Common reward emojis for quick selection
const EMOJI_OPTIONS = [
  '🍿', '🎨', '🎮', '🍕', '🍦', '🎬', '📱', '🎁',
  '🏊', '🚴', '⚽', '🎯', '🎪', '🛒', '🧸', '🎠',
];

// Audience options for reward visibility
const AUDIENCE_OPTIONS: { value: RewardAudience; label: string; hint: string }[] = [
  { value: 'family', label: 'Dla wszystkich', hint: 'Widoczna w trybie dziecka i rodzica' },
  { value: 'child', label: 'Tylko dziecko', hint: 'Widoczna tylko w trybie dziecka' },
  { value: 'adult', label: 'Tylko dorosły', hint: 'Ukryta przed dzieckiem' },
];

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CustomReward, 'id' | 'createdAt'>) => void;
  reward?: CustomReward | null; // If provided, we're editing
  initialAudience?: RewardAudience; // Pre-select audience when creating new
}

export default function RewardModal({ isOpen, onClose, onSave, reward, initialAudience }: RewardModalProps) {
  const [emoji, setEmoji] = useState('🎁');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(50);
  const [hint, setHint] = useState('');
  const [audience, setAudience] = useState<RewardAudience>('family');
  const [errors, setErrors] = useState<{ title?: string; target?: string }>({});

  const titleInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Reset form when opening/closing or when reward changes
  useEffect(() => {
    if (isOpen) {
      if (reward) {
        setEmoji(reward.emoji);
        setTitle(reward.title);
        setTarget(reward.target);
        setHint(reward.hint ?? '');
        setAudience(reward.audience);
      } else {
        setEmoji('🎁');
        setTitle('');
        setTarget(50);
        setHint('');
        setAudience(initialAudience ?? 'family');
      }
      setErrors({});

      // Focus title input after animation
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, reward, initialAudience]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: { title?: string; target?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Nazwa nagrody jest wymagana';
    }

    if (target < 1) {
      newErrors.target = 'Koszt musi wynosić co najmniej 1 punkt';
    }

    if (target > 9999) {
      newErrors.target = 'Koszt nie może przekraczać 9999 punktów';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSave({
      emoji,
      title: title.trim(),
      target,
      hint: hint.trim() || undefined,
      audience,
    });

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
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
          aria-labelledby="reward-modal-title"
          onKeyDown={handleKeyDown}
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
            <h2 id="reward-modal-title" className={styles.title}>
              {reward ? 'Edytuj nagrodę' : 'Nowa nagroda'}
            </h2>

            <div className={styles.form}>
              {/* Emoji picker */}
              <div className={styles.field}>
                <label className={styles.label}>Ikona</label>
                <div className={styles.emojiGrid}>
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className={`${styles.emojiOption} ${emoji === e ? styles.emojiSelected : ''}`}
                      onClick={() => setEmoji(e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="reward-title">
                  Nazwa nagrody
                </label>
                <input
                  ref={titleInputRef}
                  id="reward-title"
                  type="text"
                  className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder="np. Lody w parku"
                  maxLength={50}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}
              </div>

              {/* Target points */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="reward-target">
                  Koszt (punkty)
                </label>
                <input
                  id="reward-target"
                  type="number"
                  inputMode="numeric"
                  className={`${styles.input} ${styles.inputNumber} ${errors.target ? styles.inputError : ''}`}
                  value={target}
                  onChange={(e) => {
                    setTarget(Math.max(0, parseInt(e.target.value, 10) || 0));
                    if (errors.target) setErrors((prev) => ({ ...prev, target: undefined }));
                  }}
                  min={1}
                  max={9999}
                />
                {errors.target && <p className={styles.error}>{errors.target}</p>}
              </div>

              {/* Hint (optional) */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="reward-hint">
                  Opis (opcjonalny)
                </label>
                <input
                  id="reward-hint"
                  type="text"
                  className={styles.input}
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="np. Wybierz dowolny smak!"
                  maxLength={100}
                />
              </div>

              {/* Audience selector */}
              <div className={styles.field}>
                <label className={styles.label}>Widoczność</label>
                <div className={styles.audienceGrid} role="radiogroup" aria-label="Kto widzi nagrodę">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={audience === opt.value}
                      className={`${styles.audienceOption} ${audience === opt.value ? styles.audienceSelected : ''}`}
                      onClick={() => setAudience(opt.value)}
                    >
                      <strong>{opt.label}</strong>
                      <span>{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.submitButton} onClick={handleSubmit}>
                {reward ? 'Zapisz' : 'Dodaj nagrodę'}
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

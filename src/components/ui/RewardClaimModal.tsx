/**
 * RewardClaimModal - Confirmation modal for claiming rewards in parent mode
 */

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CustomReward } from '@/types';
import { formatPoints } from '@utils/formatting';
import styles from './RewardClaimModal.module.css';

const AUDIENCE_LABEL: Record<CustomReward['audience'], string> = {
  family: 'Dla wszystkich',
  child: 'Tylko dziecko',
  adult: 'Tylko dorosły',
};

interface RewardClaimModalProps {
  isOpen: boolean;
  reward: CustomReward | null;
  availablePoints: number;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RewardClaimModal({
  isOpen,
  reward,
  availablePoints,
  onClose,
  onConfirm,
}: RewardClaimModalProps) {
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

  if (!reward) {
    return null;
  }

  const nextBalance = Math.max(0, availablePoints - reward.target);

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
          aria-labelledby="reward-claim-modal-title"
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
              <span className={styles.emoji} aria-hidden="true">
                {reward.emoji}
              </span>
              <div className={styles.heroText}>
                <p className={styles.eyebrow}>Potwierdzenie odbioru</p>
                <h2 id="reward-claim-modal-title" className={styles.title}>
                  {reward.title}
                </h2>
                <span className={styles.audienceBadge}>{AUDIENCE_LABEL[reward.audience]}</span>
              </div>
            </div>

            <p className={styles.description}>
              Odbiór zapisze nagrodę w historii i od razu pomniejszy dostępne saldo punktów.
            </p>

            <dl className={styles.balanceList}>
              <div>
                <dt>Saldo przed odbiorem</dt>
                <dd>{formatPoints(availablePoints)}</dd>
              </div>
              <div>
                <dt>Koszt nagrody</dt>
                <dd>{formatPoints(reward.target)}</dd>
              </div>
              <div>
                <dt>Saldo po odbiorze</dt>
                <dd>{formatPoints(nextBalance)}</dd>
              </div>
            </dl>

            {reward.hint && <p className={styles.hint}>{reward.hint}</p>}

            <div className={styles.actions}>
              <button type="button" className={styles.confirmButton} onClick={onConfirm}>
                Odbierz nagrodę
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

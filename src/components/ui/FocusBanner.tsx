import { useMemo } from 'react';
import styles from './FocusBanner.module.css';

interface FocusBannerProps {
  done: number;
  total: number;
  points: number;
  streak: number;
}

export default function FocusBanner({ done, total, points, streak }: FocusBannerProps) {
  const remaining = Math.max(0, total - done);
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

  const statusText = useMemo(() => {
    if (total === 0) return 'Brak zadań na dziś';
    if (remaining === 0) return 'Wszystko zrobione! 🎉';
    if (remaining === 1) return 'Zostało 1 zadanie';
    if (remaining < 5) return `Zostały ${remaining} zadania`;
    return `Zostało ${remaining} zadań`;
  }, [total, remaining]);

  return (
    <div className={styles.banner}>
      <div className={styles.row}>
        <div className={styles.text}>
          <span className={styles.eyebrow}>Plan na dziś</span>
          <strong className={styles.title}>{statusText}</strong>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.value}>{points}</span>
            <small className={styles.label}>pkt dziś</small>
          </div>
          <div className={`${styles.stat} ${styles.statStreak}`}>
            <span className={styles.value}>🔥{streak}</span>
            <small className={styles.label}>dni</small>
          </div>
        </div>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <div
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
          data-complete={percentage === 100}
        />
      </div>
    </div>
  );
}

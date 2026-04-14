import { useEffect, useState } from 'react';
import styles from './PointsTile.module.css';

interface PointsTileProps {
  totalPoints: number;
  onClickAction?: () => void;
}

export default function PointsTile({ totalPoints, onClickAction }: PointsTileProps) {
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!isSpinning) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setIsSpinning(false);
      onClickAction?.();
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [isSpinning, onClickAction]);

  const handleClick = () => {
    if (isSpinning) {
      return;
    }

    setIsSpinning(true);
  };

  return (
    <button
      type="button"
      className={styles.tile}
      onClick={handleClick}
      aria-label="Otwórz punkty i nagrody"
    >
      <div className={styles.header}>
        <h2 className={styles.title}>Punkty dziś</h2>
        <span className={styles.arrow} aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path
              d="M5 12h14m-6-6 6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <div className={styles.body}>
        <span
          className={`${styles.star} ${isSpinning ? styles.starSpin : styles.starPulse}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path
              d="m12 2.7 2.87 5.82 6.43.94-4.65 4.53 1.1 6.4L12 17.34 6.25 20.4l1.1-6.4L2.7 9.46l6.43-.94L12 2.7Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={styles.value}>{totalPoints}</span>
      </div>
    </button>
  );
}

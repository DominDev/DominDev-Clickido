import { useEffect, useState } from 'react';
import KidsStarIcon from './KidsStarIcon';
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
          <KidsStarIcon />
        </span>
        <span className={styles.value}>{totalPoints}</span>
      </div>
    </button>
  );
}

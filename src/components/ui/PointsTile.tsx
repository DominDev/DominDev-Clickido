import { useEffect, useState } from 'react';
import KidsStarIcon from './KidsStarIcon';
import styles from './PointsTile.module.css';

interface PointsTileProps {
  value: number;
  label?: string;
  subValue?: number;
  subLabel?: string;
  onClickAction?: () => void;
}

export default function PointsTile({ 
  value, 
  label = 'Punkty dziś', 
  subValue,
  subLabel,
  onClickAction 
}: PointsTileProps) {
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

    if (onClickAction) {
      setIsSpinning(true);
    }
  };

  const isInteractive = Boolean(onClickAction);

  return (
    <button
      type="button"
      className={`${styles.tile} ${!isInteractive ? styles.nonInteractive : ''}`}
      onClick={handleClick}
      aria-label="Punkty i nagrody"
      disabled={!isInteractive}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{label}</h2>
        {isInteractive && (
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
        )}
      </div>

      <div className={styles.body}>
        <span
          className={`${styles.star} ${isSpinning ? styles.starSpin : styles.starPulse}`}
          aria-hidden="true"
        >
          <KidsStarIcon />
        </span>
        <span className={styles.value}>{value}</span>
      </div>

      {subValue !== undefined && subLabel && (
        <div className={styles.footer}>
          <span className={styles.subLabel}>{subLabel}</span>
          <span className={styles.subValue}>
            <KidsStarIcon className={styles.tinyStar} />
            +{subValue}
          </span>
        </div>
      )}
    </button>
  );
}

/**
 * ProgressRing - Circular progress indicator (SVG)
 */

import { motion } from 'framer-motion';
import styles from './ProgressRing.module.css';

type DisplayMode = 'percentage' | 'fraction';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  label?: string;
  displayMode?: DisplayMode;
  completed?: number;
  total?: number;
  onClick?: () => void;
}

export default function ProgressRing({
  percentage,
  size = 52,
  strokeWidth = 4,
  showPercentage = true,
  label,
  displayMode = 'percentage',
  completed = 0,
  total = 0,
  onClick,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const normalizedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  const isComplete = normalizedPercentage >= 100;

  const center = size / 2;
  const isClickable = Boolean(onClick);

  const displayText = displayMode === 'fraction' ? `${completed}/${total}` : `${normalizedPercentage}%`;

  return (
    <div
      className={`${styles.container} ${isClickable ? styles.clickable : ''}`}
      style={{ width: size, height: size }}
      data-complete={isComplete}
      role={isClickable ? 'button' : 'img'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={label ?? `Postęp wykonania: ${normalizedPercentage}%`}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
    >
      <svg
        className={styles.svg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          className={styles.backgroundCircle}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          className={styles.progressCircle}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          }}
        />
      </svg>

      {showPercentage && (
        <span className={styles.percentage}>
          {displayText}
        </span>
      )}
    </div>
  );
}

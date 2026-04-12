/**
 * ProgressRing - Circular progress indicator (SVG)
 */

import { motion } from 'framer-motion';
import styles from './ProgressRing.module.css';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
}

export default function ProgressRing({
  percentage,
  size = 52,
  strokeWidth = 4,
  showPercentage = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const center = size / 2;

  return (
    <div className={styles.container} style={{ width: size, height: size }}>
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
          {percentage}%
        </span>
      )}
    </div>
  );
}

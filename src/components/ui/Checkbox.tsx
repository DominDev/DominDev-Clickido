/**
 * Checkbox - Animated checkbox with spring effect
 */

import { motion } from 'framer-motion';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  size?: number;
  'aria-label'?: string;
}

export default function Checkbox({
  checked,
  onChange,
  size = 32,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`${styles.checkbox} ${checked ? styles.checked : ''}`}
      onClick={onChange}
      style={{ width: size, height: size }}
    >
      <motion.div
        className={styles.inner}
        initial={false}
        animate={{
          scale: checked ? [0, 1.15, 1] : 1,
          backgroundColor: checked
            ? 'var(--color-success)'
            : 'transparent',
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 15,
        }}
      >
        {checked && (
          <motion.svg
            className={styles.checkmark}
            viewBox="0 0 24 24"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <motion.path
              d="M5 12l5 5L19 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </motion.div>
    </button>
  );
}

/**
 * Toast - Notification toast with undo support
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast as ToastType } from '@/types';
import { useUIStore } from '@store/uiStore';
import styles from './Toast.module.css';

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className={styles.container} aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: ToastType;
  onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  return (
    <motion.div
      className={`${styles.toast} ${styles[toast.type]}`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <span className={styles.message}>{toast.message}</span>

      {toast.type === 'undo' && toast.onUndo && (
        <button
          className={styles.undoBtn}
          onClick={() => {
            toast.onUndo?.();
            onRemove();
          }}
        >
          Cofnij
        </button>
      )}

      <button
        className={styles.closeBtn}
        onClick={onRemove}
        aria-label="Zamknij powiadomienie"
      >
        ×
      </button>

      {toast.duration > 0 && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

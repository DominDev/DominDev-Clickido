/**
 * Toast - Notification toast with undo support
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toast as ToastType } from '@/types';
import { useUIStore } from '@store/uiStore';
import styles from './Toast.module.css';

const TOAST_META: Record<ToastType['type'], { icon: string; label: string }> = {
  success: { icon: '✅', label: 'Sukces' },
  error: { icon: '⚠️', label: 'Błąd' },
  info: { icon: 'ℹ️', label: 'Informacja' },
  undo: { icon: '↩️', label: 'Możesz cofnąć' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
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
  const meta = TOAST_META[toast.type];

  useEffect(() => {
    if (toast.duration <= 0) return undefined;

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
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      role={toast.type === 'error' ? 'alert' : 'status'}
    >
      <div className={styles.iconWrap} aria-hidden="true">
        <span className={styles.icon}>{meta.icon}</span>
      </div>

      <div className={styles.content}>
        <span className={styles.label}>{meta.label}</span>
        <span className={styles.message}>{toast.message}</span>
      </div>

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
        <div className={styles.progressBar} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      )}
    </motion.div>
  );
}

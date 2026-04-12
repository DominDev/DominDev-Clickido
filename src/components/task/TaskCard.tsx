/**
 * TaskCard - Individual task card with checkbox
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Task } from '@/types';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { getCategoryColor, getCategoryLabel } from '@utils/categories';
import { formatMinutes } from '@utils/formatting';
import Checkbox from '../ui/Checkbox';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  onEdit?: (task: Task) => void;
}

const KIDS_CELEBRATION_EMOJIS = ['🎉', '🌟', '💪', '😎', '🏆'];
const KIDS_CELEBRATION_TEXTS = ['SUPER!', 'BRAWO!', 'MEGA!', 'WOW!', 'ŚWIETNIE!'];

function randomFrom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function TaskCard({ task, isCompleted, onEdit }: TaskCardProps) {
  const { completeTask, uncompleteTask } = useTaskStore();
  const { display } = useSettingsStore();
  const [celebration, setCelebration] = useState<{ emoji: string; text: string } | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!celebration) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCelebration(null);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [celebration]);

  const handleToggle = () => {
    if (isCompleted) {
      uncompleteTask(task.id);
      return;
    }

    completeTask(task.id, task.points);

    if (display.kidsMode) {
      setCelebration({
        emoji: randomFrom(KIDS_CELEBRATION_EMOJIS),
        text: randomFrom(KIDS_CELEBRATION_TEXTS),
      });
    }
  };

  const handleContentClick = () => {
    if (display.kidsMode) {
      handleToggle();
      return;
    }

    onEdit?.(task);
  };

  const categoryColor = getCategoryColor(task.category);
  const categoryLabel = getCategoryLabel(task.category);

  return (
    <>
      <motion.article
        className={`${styles.card} ${isCompleted ? styles.completed : ''} ${
          display.kidsMode ? styles.kidsCard : ''
        }`}
        layout
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -100 }}
        transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2 }}
        style={{ '--category-color': categoryColor } as React.CSSProperties}
      >
        <div className={styles.checkboxArea}>
          <Checkbox
            checked={isCompleted}
            onChange={handleToggle}
            size={display.kidsMode ? 48 : 32}
            aria-label={`Oznacz "${task.title}" jako ${isCompleted ? 'nieukończone' : 'ukończone'}`}
          />
        </div>

        <button
          className={styles.content}
          onClick={handleContentClick}
          type="button"
          aria-label={
            display.kidsMode
              ? `Wykonaj zadanie "${task.title}"`
              : `Edytuj zadanie "${task.title}"`
          }
        >
          <div className={styles.emojiWrap}>
            <span className={styles.emoji} aria-hidden="true">
              {task.emoji}
            </span>
          </div>

          <div className={styles.textContent}>
            {display.kidsMode && (
              <span className={styles.kidsCategoryBadge}>{categoryLabel}</span>
            )}

            <h3 className={styles.title}>{task.title}</h3>

            {!display.kidsMode && display.showTimeEstimate && task.estimatedMinutes > 0 && (
              <span className={styles.time}>{formatMinutes(task.estimatedMinutes)}</span>
            )}

            {display.kidsMode ? (
              <div className={styles.kidsFooter}>
                <span className={styles.kidsHint}>
                  {isCompleted ? 'Gotowe!' : 'Dotknij, gdy zrobione'}
                </span>
                {display.showPoints && (
                  <span className={styles.kidsPointsBubble}>⭐ {task.points}</span>
                )}
              </div>
            ) : null}
          </div>

          {!display.kidsMode && display.showPoints && (
            <span className={styles.points}>+{task.points}</span>
          )}
        </button>
      </motion.article>

      <AnimatePresence>
        {display.kidsMode && celebration && (
          <motion.div
            className={styles.celebrationOverlay}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2 }}
            onClick={() => setCelebration(null)}
          >
            <motion.div
              className={styles.celebrationCard}
              initial={prefersReducedMotion ? false : { scale: 0.6, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.01 }
                  : { type: 'spring', stiffness: 260, damping: 16 }
              }
            >
              <span className={styles.celebrationEmoji} aria-hidden="true">
                {celebration.emoji}
              </span>
              <strong className={styles.celebrationText}>{celebration.text}</strong>
              <span className={styles.celebrationSubtext}>Zadanie wykonane!</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

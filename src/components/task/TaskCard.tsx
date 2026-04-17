/**
 * TaskCard - Individual task card with checkbox
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Task } from '@/types';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { getCategoryById, getCategoryColor } from '@utils/categories';
import { formatMinutes } from '@utils/formatting';
import Checkbox from '../ui/Checkbox';
import { KidsStarIcon } from '../ui';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  onEdit?: (task: Task) => void;
}

const KIDS_CELEBRATION_EMOJIS = ['🎉', '🌟', '😄', '😎', '🏆'];
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

  const categoryColor = getCategoryColor(task.category);
  const category = getCategoryById(task.category);

  const handleCardClick = () => {
    if (display.kidsMode) {
      handleToggle();
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  return (
    <>
      <motion.article
        data-complete-stamp={display.kidsMode && isCompleted ? 'SUPER!' : undefined}
        className={`${styles.card} ${isCompleted ? styles.completed : ''} ${
          display.kidsMode ? styles.kidsCard : ''
        }`}
        layout
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -100 }}
        whileTap={
          display.kidsMode && !prefersReducedMotion
            ? { scale: isCompleted ? 0.985 : 0.94 }
            : undefined
        }
        transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2 }}
        style={{ '--category-color': categoryColor } as React.CSSProperties}
        onClick={handleCardClick}
        role={display.kidsMode ? 'button' : undefined}
        tabIndex={display.kidsMode ? 0 : undefined}
        aria-label={display.kidsMode ? `${isCompleted ? 'Odznacz' : 'Zaznacz'} zadanie "${task.title}"` : undefined}
      >
        {!display.kidsMode && (
          <div className={styles.checkboxArea} onClick={handleCheckboxClick}>
            <Checkbox
              checked={isCompleted}
              onChange={handleToggle}
              size={32}
              aria-label={`Oznacz "${task.title}" jako ${isCompleted ? 'nieukończone' : 'ukończone'}`}
            />
          </div>
        )}

        <div className={styles.content}>
          {display.kidsMode && (
            <span
              className={`${styles.kidsStatusBadge} ${
                isCompleted ? styles.kidsStatusDone : styles.kidsStatusTodo
              }`}
            >
              <KidsStarIcon className={styles.kidsStatusStar} />
              <span>{task.points}</span>
              {isCompleted && <span>· Gotowe!</span>}
            </span>
          )}

          <div className={styles.emojiWrap}>
            <span className={styles.emoji} aria-hidden="true">
              {task.emoji}
            </span>
          </div>

          <div className={styles.textContent}>
            <h3 className={styles.title}>{task.title}</h3>

            {!display.kidsMode && (
              <div className={styles.meta}>
                {category && <span className={styles.category}>{category.label}</span>}
                {display.showTimeEstimate && task.estimatedMinutes > 0 && (
                  <span className={styles.time}>{formatMinutes(task.estimatedMinutes)}</span>
                )}
              </div>
            )}
          </div>

          {!display.kidsMode && display.showPoints && (
            <span className={styles.points}>+{task.points}</span>
          )}

          {!display.kidsMode && onEdit && (
            <button
              type="button"
              className={styles.editButton}
              onClick={handleEditClick}
              aria-label={`Edytuj zadanie "${task.title}"`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
          )}
        </div>
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

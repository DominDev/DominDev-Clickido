import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Task } from '@/types';
import { useTaskStore } from '@store/taskStore';
import styles from './KidsTaskTile.module.css';

interface KidsTaskTileProps {
  task: Task;
  isCompleted: boolean;
  isNext?: boolean;
}

const KidsTaskTile = forwardRef<HTMLButtonElement, KidsTaskTileProps>(({ task, isCompleted, isNext = false }, ref) => {
  const { completeTask, uncompleteTask } = useTaskStore();

  const handleToggle = () => {
    if (isCompleted) {
      uncompleteTask(task.id);
    } else {
      completeTask(task.id, task.points);
    }
  };

  return (
    <motion.button
      ref={ref}
      className={`${styles.tile} ${isCompleted ? styles.completed : ''} ${
        isNext && !isCompleted ? styles.next : ''
      }`}
      onClick={handleToggle}
      layout
      whileTap={{ scale: 0.96 }}
      aria-pressed={isCompleted}
    >
      {isNext && !isCompleted && (
        <span className={styles.hint} aria-hidden="true">
          👆 Stuknij!
        </span>
      )}
      
      <div className={styles.emojiWrap}>
        <span className={styles.emoji} aria-hidden="true">
          {task.emoji}
        </span>
      </div>

      <div className={styles.body}>
        <span className={styles.title}>{task.title}</span>
        {!isCompleted && (
          <span className={styles.points}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.starIcon}>
              <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.8 5.7 21.2l1.7-7L2 9.5l7.1-.6z" />
            </svg>
            +{task.points}
          </span>
        )}
      </div>

      {isCompleted && (
        <div className={styles.stamp} aria-label="Gotowe">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.checkIcon}
          >
            <path d="M5 12.5l4 4 10-10" />
          </svg>
        </div>
      )}
    </motion.button>
  );
});

KidsTaskTile.displayName = 'KidsTaskTile';

export default KidsTaskTile;

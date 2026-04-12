/**
 * TaskCard - Individual task card with checkbox
 */

import { motion } from 'framer-motion';
import { Task } from '@/types';
import { useTaskStore } from '@store/taskStore';
import { useSettingsStore } from '@store/settingsStore';
import { getCategoryColor } from '@utils/categories';
import { formatMinutes } from '@utils/formatting';
import Checkbox from '../ui/Checkbox';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, isCompleted, onEdit }: TaskCardProps) {
  const { completeTask, uncompleteTask } = useTaskStore();
  const { display } = useSettingsStore();

  const handleToggle = () => {
    if (isCompleted) {
      uncompleteTask(task.id);
    } else {
      completeTask(task.id, task.points);
    }
  };

  const handleCardClick = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const categoryColor = getCategoryColor(task.category);

  return (
    <motion.article
      className={`${styles.card} ${isCompleted ? styles.completed : ''}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      style={{
        '--category-color': categoryColor,
      } as React.CSSProperties}
    >
      <div className={styles.checkboxArea}>
        <Checkbox
          checked={isCompleted}
          onChange={handleToggle}
          aria-label={`Oznacz "${task.title}" jako ${isCompleted ? 'nieukończone' : 'ukończone'}`}
        />
      </div>

      <button
        className={styles.content}
        onClick={handleCardClick}
        type="button"
        aria-label={`Edytuj zadanie "${task.title}"`}
      >
        <span className={styles.emoji} aria-hidden="true">
          {task.emoji}
        </span>

        <div className={styles.textContent}>
          <h3 className={styles.title}>{task.title}</h3>

          {display.showTimeEstimate && task.estimatedMinutes > 0 && (
            <span className={styles.time}>
              {formatMinutes(task.estimatedMinutes)}
            </span>
          )}
        </div>

        {display.showPoints && (
          <span className={styles.points}>
            +{task.points}
          </span>
        )}
      </button>
    </motion.article>
  );
}

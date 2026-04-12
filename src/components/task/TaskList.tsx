/**
 * TaskList - List of tasks with stagger animation
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Task } from '@/types';
import { useTaskStore } from '@store/taskStore';
import { useUIStore } from '@store/uiStore';
import TaskCard from './TaskCard';
import styles from './TaskList.module.css';

interface EmptyAction {
  label: string;
  onClick: () => void;
}

interface TaskListProps {
  tasks: Task[];
  emptyTitle?: string;
  emptyMessage?: string;
  emptyPrimaryAction?: EmptyAction;
  emptySecondaryAction?: EmptyAction;
}

export default function TaskList({
  tasks,
  emptyTitle = 'Brak zadań na ten dzień',
  emptyMessage = 'Nie ma jeszcze żadnych zadań do pokazania.',
  emptyPrimaryAction,
  emptySecondaryAction,
}: TaskListProps) {
  const { isTaskCompleted } = useTaskStore();
  const { openModal, setEditingTask } = useUIStore();

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    openModal('taskForm');
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aCompleted = isTaskCompleted(a.id);
    const bCompleted = isTaskCompleted(b.id);
    if (aCompleted === bCompleted) return 0;
    return aCompleted ? 1 : -1;
  });

  if (tasks.length === 0) {
    return (
      <motion.div
        className={styles.empty}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className={styles.emptyIcon} aria-hidden="true">
          📋
        </span>
        <h2 className={styles.emptyTitle}>{emptyTitle}</h2>
        <p className={styles.emptyText}>{emptyMessage}</p>

        {(emptyPrimaryAction || emptySecondaryAction) && (
          <div className={styles.emptyActions}>
            {emptyPrimaryAction && (
              <button
                type="button"
                className={styles.primaryAction}
                onClick={emptyPrimaryAction.onClick}
              >
                {emptyPrimaryAction.label}
              </button>
            )}

            {emptySecondaryAction && (
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={emptySecondaryAction.onClick}
              >
                {emptySecondaryAction.label}
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.list}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      <AnimatePresence mode="popLayout">
        {sortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isCompleted={isTaskCompleted(task.id)}
            onEdit={handleEditTask}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

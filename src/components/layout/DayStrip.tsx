/**
 * DayStrip - Week day selector with task indicators
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { addDays, isSameDay, isToday, startOfWeek } from 'date-fns';
import { useTaskStore } from '@store/taskStore';
import { isTaskCompleted } from '@services/completionService';
import { getDayAbbreviation } from '@utils/formatting';
import { getTasksForDate } from '@utils/recurrence';
import styles from './DayStrip.module.css';

export default function DayStrip() {
  const { tasks, selectedDate, setSelectedDate } = useTaskStore();

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [selectedDate]);

  const dayData = useMemo(() => {
    return weekDays.map((date) => {
      const dayTasks = getTasksForDate(tasks, date);
      const completedTasks = dayTasks.filter((task) => isTaskCompleted(task.id, date));

      return {
        date,
        taskCount: dayTasks.length,
        completedCount: completedTasks.length,
        isAllCompleted: dayTasks.length > 0 && completedTasks.length === dayTasks.length,
      };
    });
  }, [weekDays, tasks]);

  const getDotCount = (taskCount: number): number => {
    if (taskCount === 0) return 0;
    if (taskCount <= 3) return 1;
    if (taskCount <= 6) return 2;
    return 3;
  };

  const getAriaLabel = (taskCount: number, completedCount: number, isTodayDate: boolean): string => {
    const taskLabel =
      taskCount === 0
        ? 'brak zadań'
        : taskCount === 1
          ? '1 zadanie'
          : `${taskCount} zadań`;

    const completionLabel =
      completedCount === 0
        ? 'nic nieukończone'
        : completedCount === taskCount
          ? 'wszystko ukończone'
          : `ukończono ${completedCount} z ${taskCount}`;

    return `${isTodayDate ? 'Dziś, ' : ''}${taskLabel}, ${completionLabel}`;
  };

  return (
    <div className={styles.strip} role="tablist" aria-label="Wybór dnia tygodnia">
      {dayData.map((day) => {
        const isSelected = isSameDay(day.date, selectedDate);
        const isTodayDate = isToday(day.date);
        const dotCount = getDotCount(day.taskCount);

        return (
          <button
            key={day.date.toISOString()}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={getAriaLabel(day.taskCount, day.completedCount, isTodayDate)}
            title={getAriaLabel(day.taskCount, day.completedCount, isTodayDate)}
            className={`${styles.day} ${isSelected ? styles.selected : ''} ${
              isTodayDate ? styles.today : ''
            } ${day.isAllCompleted ? styles.completed : ''}`}
            onClick={() => setSelectedDate(day.date)}
          >
            <span className={styles.dayName}>{getDayAbbreviation(day.date.getDay())}</span>

            <motion.span
              className={styles.dayNumber}
              initial={false}
              animate={{ scale: isSelected ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            >
              {day.date.getDate()}
            </motion.span>

            <span className={styles.meta}>
              {day.taskCount > 0 ? `${day.completedCount}/${day.taskCount}` : '—'}
            </span>

            <div className={styles.dots} aria-hidden="true">
              {Array.from({ length: dotCount }, (_, index) => (
                <span
                  key={index}
                  className={`${styles.dot} ${day.isAllCompleted ? styles.dotCompleted : ''}`}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

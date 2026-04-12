/**
 * DayStrip - Week day selector with task indicators
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { useTaskStore } from '@store/taskStore';
import { getDayAbbreviation } from '@utils/formatting';
import { getTasksForDate } from '@utils/recurrence';
import { isTaskCompleted } from '@services/completionService';
import styles from './DayStrip.module.css';

export default function DayStrip() {
  const { tasks, selectedDate, setSelectedDate } = useTaskStore();

  // Get week days starting from Monday
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  // Get task counts and completion status for each day
  const dayData = useMemo(() => {
    return weekDays.map((date) => {
      const dayTasks = getTasksForDate(tasks, date);
      const completedTasks = dayTasks.filter((task) =>
        isTaskCompleted(task.id, date)
      );

      return {
        date,
        taskCount: dayTasks.length,
        completedCount: completedTasks.length,
        isAllCompleted: dayTasks.length > 0 && completedTasks.length === dayTasks.length,
      };
    });
  }, [weekDays, tasks]);

  // Get dot count based on task count
  const getDotCount = (taskCount: number): number => {
    if (taskCount === 0) return 0;
    if (taskCount <= 3) return 1;
    if (taskCount <= 6) return 2;
    return 3;
  };

  return (
    <div className={styles.strip} role="tablist" aria-label="Wybór dnia tygodnia">
      {dayData.map((day, index) => {
        const isSelected = isSameDay(day.date, selectedDate);
        const isTodayDate = isToday(day.date);
        const dotCount = getDotCount(day.taskCount);

        return (
          <button
            key={index}
            role="tab"
            aria-selected={isSelected}
            className={`${styles.day} ${isSelected ? styles.selected : ''} ${
              isTodayDate ? styles.today : ''
            } ${day.isAllCompleted ? styles.completed : ''}`}
            onClick={() => setSelectedDate(day.date)}
          >
            <span className={styles.dayName}>
              {getDayAbbreviation(day.date.getDay())}
            </span>

            <motion.span
              className={styles.dayNumber}
              initial={false}
              animate={{
                scale: isSelected ? 1.1 : 1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {day.date.getDate()}
            </motion.span>

            <div className={styles.dots} aria-hidden="true">
              {Array.from({ length: dotCount }, (_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${
                    day.isAllCompleted ? styles.dotCompleted : ''
                  }`}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

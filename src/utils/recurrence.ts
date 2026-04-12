/**
 * Recurrence Engine - Logic for filtering tasks by date
 */

import { Task } from '@/types';
import { format, parseISO, differenceInDays, getDay, getDate, isSameDay } from 'date-fns';

/**
 * Get tasks that should appear on a specific date
 */
export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  return tasks.filter((task) => isTaskScheduledForDate(task, date));
}

/**
 * Check if a task is scheduled for a specific date
 */
export function isTaskScheduledForDate(task: Task, date: Date): boolean {
  switch (task.recurrence) {
    case 'daily':
      return true;

    case 'weekly':
      return isWeeklyTaskScheduled(task, date);

    case 'interval':
      return isIntervalTaskScheduled(task, date);

    case 'monthly':
      return isMonthlyTaskScheduled(task, date);

    case 'once':
      return isOnceTaskScheduled(task, date);

    default:
      return false;
  }
}

/**
 * Check if weekly task is scheduled for date
 */
function isWeeklyTaskScheduled(task: Task, date: Date): boolean {
  if (!task.daysOfWeek || task.daysOfWeek.length === 0) {
    return false;
  }

  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  const dayOfWeek = getDay(date);
  return task.daysOfWeek.includes(dayOfWeek);
}

/**
 * Check if interval task is scheduled for date
 */
function isIntervalTaskScheduled(task: Task, date: Date): boolean {
  if (!task.intervalDays || !task.intervalStartDate) {
    return false;
  }

  const startDate = parseISO(task.intervalStartDate);
  const daysSinceStart = differenceInDays(date, startDate);

  // Only show on or after start date
  if (daysSinceStart < 0) {
    return false;
  }

  return daysSinceStart % task.intervalDays === 0;
}

/**
 * Check if monthly task is scheduled for date
 */
function isMonthlyTaskScheduled(task: Task, date: Date): boolean {
  if (!task.dayOfMonth) {
    return false;
  }

  // We cap day of month to 1-28 to avoid issues with shorter months
  const dayOfMonth = getDate(date);
  return dayOfMonth === task.dayOfMonth;
}

/**
 * Check if one-time task is scheduled for date
 */
function isOnceTaskScheduled(task: Task, date: Date): boolean {
  if (!task.date) {
    return false;
  }

  const taskDate = parseISO(task.date);
  return isSameDay(taskDate, date);
}

/**
 * Get the next occurrence date for a task
 */
export function getNextOccurrence(task: Task, afterDate: Date = new Date()): Date | null {
  const maxDays = 365; // Don't search more than a year ahead

  for (let i = 0; i <= maxDays; i++) {
    const checkDate = new Date(afterDate);
    checkDate.setDate(checkDate.getDate() + i);

    if (isTaskScheduledForDate(task, checkDate)) {
      return checkDate;
    }
  }

  return null;
}

/**
 * Get human-readable recurrence description
 */
export function getRecurrenceDescription(task: Task): string {
  switch (task.recurrence) {
    case 'daily':
      return 'Codziennie';

    case 'weekly':
      if (!task.daysOfWeek || task.daysOfWeek.length === 0) {
        return 'Co tydzień';
      }
      if (task.daysOfWeek.length === 7) {
        return 'Codziennie';
      }
      if (task.daysOfWeek.length === 5 &&
          task.daysOfWeek.includes(1) &&
          task.daysOfWeek.includes(2) &&
          task.daysOfWeek.includes(3) &&
          task.daysOfWeek.includes(4) &&
          task.daysOfWeek.includes(5)) {
        return 'Dni robocze';
      }
      if (task.daysOfWeek.length === 2 &&
          task.daysOfWeek.includes(0) &&
          task.daysOfWeek.includes(6)) {
        return 'Weekendy';
      }
      return getDaysOfWeekNames(task.daysOfWeek);

    case 'interval':
      if (!task.intervalDays) return 'Co kilka dni';
      if (task.intervalDays === 2) return 'Co drugi dzień';
      if (task.intervalDays === 7) return 'Co tydzień';
      if (task.intervalDays === 14) return 'Co dwa tygodnie';
      return `Co ${task.intervalDays} dni`;

    case 'monthly':
      if (!task.dayOfMonth) return 'Co miesiąc';
      return `${task.dayOfMonth}. każdego miesiąca`;

    case 'once':
      if (!task.date) return 'Jednorazowo';
      return format(parseISO(task.date), 'd MMM yyyy');

    default:
      return '';
  }
}

/**
 * Get Polish day names for days of week
 */
function getDaysOfWeekNames(days: number[]): string {
  const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
  const sortedDays = [...days].sort((a, b) => {
    // Sort starting from Monday (1) instead of Sunday (0)
    const aAdjusted = a === 0 ? 7 : a;
    const bAdjusted = b === 0 ? 7 : b;
    return aAdjusted - bAdjusted;
  });

  return sortedDays.map((d) => dayNames[d]).join(', ');
}

/**
 * Validate recurrence configuration
 */
export function validateRecurrence(task: Partial<Task>): string[] {
  const errors: string[] = [];

  switch (task.recurrence) {
    case 'weekly':
      if (!task.daysOfWeek || task.daysOfWeek.length === 0) {
        errors.push('Wybierz przynajmniej jeden dzień tygodnia');
      }
      break;

    case 'interval':
      if (!task.intervalDays || task.intervalDays < 1) {
        errors.push('Podaj liczbę dni większą od 0');
      }
      if (!task.intervalStartDate) {
        errors.push('Podaj datę początkową');
      }
      break;

    case 'monthly':
      if (!task.dayOfMonth || task.dayOfMonth < 1 || task.dayOfMonth > 28) {
        errors.push('Podaj dzień miesiąca (1-28)');
      }
      break;

    case 'once':
      if (!task.date) {
        errors.push('Podaj datę wykonania');
      }
      break;
  }

  return errors;
}

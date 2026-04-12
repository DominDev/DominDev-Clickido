/**
 * Completion Service - Track task completions
 */

import { TaskCompletion } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from './storageService';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

/**
 * Get all completions
 */
export function getAllCompletions(): TaskCompletion[] {
  return getItem<TaskCompletion[]>(STORAGE_KEYS.COMPLETIONS, []);
}

/**
 * Check if task is completed for a specific date
 */
export function isTaskCompleted(taskId: string, date: Date): boolean {
  const completions = getAllCompletions();
  const dateStr = format(date, 'yyyy-MM-dd');

  return completions.some(
    (c) => c.taskId === taskId && c.date === dateStr
  );
}

/**
 * Mark task as completed
 */
export function completeTask(taskId: string, points: number, date: Date = new Date()): TaskCompletion {
  const completions = getAllCompletions();
  const dateStr = format(date, 'yyyy-MM-dd');

  // Check if already completed
  const existingIndex = completions.findIndex(
    (c) => c.taskId === taskId && c.date === dateStr
  );

  if (existingIndex !== -1) {
    // Already completed, return existing
    return completions[existingIndex];
  }

  const completion: TaskCompletion = {
    taskId,
    date: dateStr,
    completedAt: new Date().toISOString(),
    points,
  };

  completions.push(completion);
  setItem(STORAGE_KEYS.COMPLETIONS, completions);

  return completion;
}

/**
 * Uncomplete task (undo completion)
 */
export function uncompleteTask(taskId: string, date: Date = new Date()): boolean {
  const completions = getAllCompletions();
  const dateStr = format(date, 'yyyy-MM-dd');

  const filteredCompletions = completions.filter(
    (c) => !(c.taskId === taskId && c.date === dateStr)
  );

  if (filteredCompletions.length === completions.length) {
    return false; // Not found
  }

  setItem(STORAGE_KEYS.COMPLETIONS, filteredCompletions);
  return true;
}

/**
 * Get completions for a specific date
 */
export function getCompletionsForDate(date: Date): TaskCompletion[] {
  const completions = getAllCompletions();
  const dateStr = format(date, 'yyyy-MM-dd');

  return completions.filter((c) => c.date === dateStr);
}

/**
 * Get completions for a date range
 */
export function getCompletionsInRange(startDate: Date, endDate: Date): TaskCompletion[] {
  const completions = getAllCompletions();

  return completions.filter((c) => {
    const completionDate = parseISO(c.date);
    return isWithinInterval(completionDate, {
      start: startOfDay(startDate),
      end: endOfDay(endDate),
    });
  });
}

/**
 * Get total points for a date
 */
export function getPointsForDate(date: Date): number {
  const completions = getCompletionsForDate(date);
  return completions.reduce((sum, c) => sum + c.points, 0);
}

/**
 * Get total points for a date range
 */
export function getPointsInRange(startDate: Date, endDate: Date): number {
  const completions = getCompletionsInRange(startDate, endDate);
  return completions.reduce((sum, c) => sum + c.points, 0);
}

/**
 * Get completion statistics for a task
 */
export function getTaskStats(taskId: string): {
  totalCompletions: number;
  totalPoints: number;
  lastCompleted: string | null;
} {
  const completions = getAllCompletions().filter((c) => c.taskId === taskId);

  if (completions.length === 0) {
    return {
      totalCompletions: 0,
      totalPoints: 0,
      lastCompleted: null,
    };
  }

  // Sort by date descending
  const sorted = [...completions].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt)
  );

  return {
    totalCompletions: completions.length,
    totalPoints: completions.reduce((sum, c) => sum + c.points, 0),
    lastCompleted: sorted[0].completedAt,
  };
}

/**
 * Delete completions for a task (when task is deleted)
 */
export function deleteCompletionsForTask(taskId: string): number {
  const completions = getAllCompletions();
  const filtered = completions.filter((c) => c.taskId !== taskId);
  const deletedCount = completions.length - filtered.length;

  setItem(STORAGE_KEYS.COMPLETIONS, filtered);
  return deletedCount;
}

/**
 * Get completion count for each day in a week
 * Returns array of 7 numbers (Mon-Sun)
 */
export function getWeeklyCompletionCounts(weekStartDate: Date): number[] {
  const counts: number[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);
    const dayCompletions = getCompletionsForDate(date);
    counts.push(dayCompletions.length);
  }

  return counts;
}

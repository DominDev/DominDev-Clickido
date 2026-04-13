/**
 * Task Service - CRUD operations for tasks
 */

import { Task, CategoryId, RecurrenceType } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from './storageService';

function toTaskCreateData(task: Task): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: task.title,
    emoji: task.emoji,
    category: task.category,
    estimatedMinutes: task.estimatedMinutes,
    points: task.points,
    recurrence: task.recurrence,
    ...(task.date ? { date: task.date } : {}),
    ...(task.daysOfWeek ? { daysOfWeek: task.daysOfWeek } : {}),
    ...(task.intervalDays ? { intervalDays: task.intervalDays } : {}),
    ...(task.intervalStartDate ? { intervalStartDate: task.intervalStartDate } : {}),
    ...(task.dayOfMonth ? { dayOfMonth: task.dayOfMonth } : {}),
  };
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all tasks
 */
export function getAllTasks(): Task[] {
  return getItem<Task[]>(STORAGE_KEYS.TASKS, []);
}

/**
 * Get task by ID
 */
export function getTaskById(id: string): Task | undefined {
  const tasks = getAllTasks();
  return tasks.find((task) => task.id === id);
}

/**
 * Create new task
 */
export function createTask(
  data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Task {
  const tasks = getAllTasks();
  const now = new Date().toISOString();

  const newTask: Task = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(newTask);
  setItem(STORAGE_KEYS.TASKS, tasks);

  return newTask;
}

/**
 * Restore previously existing task with original identifiers
 */
export function restoreTask(task: Task): Task {
  const tasks = getAllTasks();
  const exists = tasks.some((item) => item.id === task.id);

  if (!exists) {
    tasks.push(task);
    setItem(STORAGE_KEYS.TASKS, tasks);
  }

  return task;
}

/**
 * Update existing task
 */
export function updateTask(
  id: string,
  data: Partial<Omit<Task, 'id' | 'createdAt'>>
): Task | null {
  const tasks = getAllTasks();
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return null;
  }

  const updatedTask: Task = {
    ...tasks[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  tasks[index] = updatedTask;
  setItem(STORAGE_KEYS.TASKS, tasks);

  return updatedTask;
}

/**
 * Delete task
 */
export function deleteTask(id: string): boolean {
  const tasks = getAllTasks();
  const filteredTasks = tasks.filter((task) => task.id !== id);

  if (filteredTasks.length === tasks.length) {
    return false; // Task not found
  }

  setItem(STORAGE_KEYS.TASKS, filteredTasks);
  return true;
}

/**
 * Get tasks by category
 */
export function getTasksByCategory(category: CategoryId): Task[] {
  const tasks = getAllTasks();
  return tasks.filter((task) => task.category === category);
}

/**
 * Get tasks by recurrence type
 */
export function getTasksByRecurrence(recurrence: RecurrenceType): Task[] {
  const tasks = getAllTasks();
  return tasks.filter((task) => task.recurrence === recurrence);
}

/**
 * Calculate points for task based on estimated time
 * Formula: minutes × 0.7, minimum 5 points
 */
export function calculatePoints(estimatedMinutes: number): number {
  return Math.max(5, Math.round(estimatedMinutes * 0.7));
}

/**
 * Batch delete tasks
 */
export function deleteTasks(ids: string[]): number {
  const tasks = getAllTasks();
  const idsSet = new Set(ids);
  const filteredTasks = tasks.filter((task) => !idsSet.has(task.id));
  const deletedCount = tasks.length - filteredTasks.length;

  setItem(STORAGE_KEYS.TASKS, filteredTasks);
  return deletedCount;
}

/**
 * Duplicate task
 */
export function duplicateTask(id: string): Task | null {
  const task = getTaskById(id);
  if (!task) {
    return null;
  }

  return createTask({
    ...toTaskCreateData(task),
    title: `${task.title} (kopia)`,
  });
}

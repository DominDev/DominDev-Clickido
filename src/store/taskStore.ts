/**
 * Task Store - Zustand store for task state management
 */

import { create } from 'zustand';
import { Task, TaskCompletion } from '@/types';
import * as taskService from '@/services/taskService';
import * as completionService from '@/services/completionService';
import { getLocalDateKey } from '@/utils/date';
import { getTasksForDate } from '@/utils/recurrence';

interface TaskState {
  tasks: Task[];
  completions: TaskCompletion[];
  selectedDate: Date;
  isLoading: boolean;

  // Actions
  loadTasks: () => void;
  loadCompletions: () => void;
  setSelectedDate: (date: Date) => void;

  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  restoreTask: (task: Task, completions?: TaskCompletion[]) => Task;
  updateTask: (id: string, data: Partial<Task>) => Task | null;
  deleteTask: (id: string) => boolean;
  duplicateTask: (id: string) => Task | null;

  // Completions
  completeTask: (taskId: string, points: number) => TaskCompletion;
  uncompleteTask: (taskId: string) => boolean;
  isTaskCompleted: (taskId: string) => boolean;

  // Computed
  getTasksForSelectedDate: () => Task[];
  getCompletedTasksForSelectedDate: () => Task[];
  getPendingTasksForSelectedDate: () => Task[];
  getProgressForSelectedDate: () => { completed: number; total: number; percentage: number };
  getPointsForSelectedDate: () => number;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  completions: [],
  selectedDate: new Date(),
  isLoading: false,

  loadTasks: () => {
    const tasks = taskService.getAllTasks();
    set({ tasks });
  },

  loadCompletions: () => {
    const completions = completionService.getAllCompletions();
    set({ completions });
  },

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
  },

  addTask: (taskData) => {
    const newTask = taskService.createTask(taskData);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },

  restoreTask: (task, completions = []) => {
    const restoredTask = taskService.restoreTask(task);
    completionService.restoreCompletions(completions);

    set((state) => {
      const tasksWithoutDuplicate = state.tasks.filter((item) => item.id !== task.id);
      const completionsWithoutDuplicate = state.completions.filter(
        (entry) =>
          !completions.some(
            (restored) => restored.taskId === entry.taskId && restored.date === entry.date
          )
      );

      return {
        tasks: [...tasksWithoutDuplicate, restoredTask],
        completions: [...completionsWithoutDuplicate, ...completions],
      };
    });

    return restoredTask;
  },

  updateTask: (id, data) => {
    const updatedTask = taskService.updateTask(id, data);
    if (updatedTask) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
    }
    return updatedTask;
  },

  deleteTask: (id) => {
    const success = taskService.deleteTask(id);
    if (success) {
      completionService.deleteCompletionsForTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        completions: state.completions.filter((c) => c.taskId !== id),
      }));
    }
    return success;
  },

  duplicateTask: (id) => {
    const newTask = taskService.duplicateTask(id);
    if (newTask) {
      set((state) => ({ tasks: [...state.tasks, newTask] }));
    }
    return newTask;
  },

  completeTask: (taskId, points) => {
    const { selectedDate } = get();
    const completion = completionService.completeTask(taskId, points, selectedDate);
    set((state) => ({ completions: [...state.completions, completion] }));
    return completion;
  },

  uncompleteTask: (taskId) => {
    const { selectedDate } = get();
    const success = completionService.uncompleteTask(taskId, selectedDate);
    if (success) {
      const selectedDateKey = getLocalDateKey(selectedDate);
      set((state) => ({
        completions: state.completions.filter(
          (c) => !(c.taskId === taskId && c.date === selectedDateKey)
        ),
      }));
    }
    return success;
  },

  isTaskCompleted: (taskId) => {
    const { selectedDate } = get();
    return completionService.isTaskCompleted(taskId, selectedDate);
  },

  getTasksForSelectedDate: () => {
    const { tasks, selectedDate } = get();
    return getTasksForDate(tasks, selectedDate);
  },

  getCompletedTasksForSelectedDate: () => {
    const { selectedDate, completions } = get();
    const dateStr = getLocalDateKey(selectedDate);
    const completedIds = new Set(
      completions.filter((c) => c.date === dateStr).map((c) => c.taskId)
    );
    return get().getTasksForSelectedDate().filter((t) => completedIds.has(t.id));
  },

  getPendingTasksForSelectedDate: () => {
    const { selectedDate, completions } = get();
    const dateStr = getLocalDateKey(selectedDate);
    const completedIds = new Set(
      completions.filter((c) => c.date === dateStr).map((c) => c.taskId)
    );
    return get().getTasksForSelectedDate().filter((t) => !completedIds.has(t.id));
  },

  getProgressForSelectedDate: () => {
    const tasksForDate = get().getTasksForSelectedDate();
    const completedTasks = get().getCompletedTasksForSelectedDate();
    const total = tasksForDate.length;
    const completed = completedTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  },

  getPointsForSelectedDate: () => {
    const { selectedDate } = get();
    return completionService.getPointsForDate(selectedDate);
  },
}));

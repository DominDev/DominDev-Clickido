/**
 * Task Store - Zustand store for task state management
 */

import { create } from 'zustand';
import { Task, TaskCompletion, CustomReward, RewardClaim, RewardClaimSource } from '@/types';
import * as taskService from '@/services/taskService';
import * as completionService from '@/services/completionService';
import * as rewardService from '@/services/rewardService';
import { getLocalDateKey } from '@/utils/date';
import { getTasksForDate } from '@/utils/recurrence';

interface TaskState {
  tasks: Task[];
  completions: TaskCompletion[];
  rewards: CustomReward[];
  rewardClaims: RewardClaim[];
  selectedDate: Date;
  isLoading: boolean;

  // Actions
  loadTasks: () => void;
  loadCompletions: () => void;
  loadRewards: () => void;
  loadRewardClaims: () => void;
  claimReward: (rewardId: string, source?: RewardClaimSource) => RewardClaim | null;
  revertRewardClaim: (claimId: string) => RewardClaim | null;
  unclaimReward: (rewardId: string) => RewardClaim | null;
  setSelectedDate: (date: Date) => void;

  // Reward CRUD
  addReward: (data: Omit<CustomReward, 'id' | 'createdAt'>) => CustomReward;
  updateReward: (id: string, data: Partial<Omit<CustomReward, 'id' | 'createdAt'>>) => CustomReward | null;
  deleteReward: (id: string) => { success: boolean; reason?: string };

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
  getTotalEarnedPoints: () => number;
  getTotalSpentPoints: () => number;
  getAvailablePoints: () => number;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  completions: [],
  rewards: [],
  rewardClaims: [],
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

  loadRewards: () => {
    const rewards = rewardService.getAllRewards();
    set({ rewards });
  },

  loadRewardClaims: () => {
    const rewardClaims = rewardService.getRewardClaims();
    set({ rewardClaims });
  },

  claimReward: (rewardId, source = 'parent') => {
    const claim = rewardService.claimReward(rewardId, source);
    if (claim) {
      get().loadRewardClaims();
    }
    return claim;
  },

  unclaimReward: (rewardId: string) => {
    const revertedClaim = rewardService.unclaimReward(rewardId);
    if (revertedClaim) {
      get().loadRewardClaims();
    }
    return revertedClaim;
  },

  revertRewardClaim: (claimId: string) => {
    const revertedClaim = rewardService.revertRewardClaim(claimId);
    if (revertedClaim) {
      get().loadRewardClaims();
    }
    return revertedClaim;
  },

  addReward: (data) => {
    const newReward = rewardService.createReward(data);
    set((state) => ({ rewards: [...state.rewards, newReward] }));
    return newReward;
  },

  updateReward: (id, data) => {
    const updated = rewardService.updateReward(id, data);
    if (updated) {
      set((state) => ({
        rewards: state.rewards.map((r) => (r.id === id ? updated : r)),
      }));
    }
    return updated;
  },

  deleteReward: (id) => {
    const result = rewardService.deleteReward(id);
    if (result.success) {
      set((state) => ({
        rewards: state.rewards.filter((r) => r.id !== id),
      }));
    }
    return result;
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
    get().loadCompletions();
    return completion;
  },

  uncompleteTask: (taskId) => {
    const { selectedDate } = get();
    const success = completionService.uncompleteTask(taskId, selectedDate);
    if (success) {
      get().loadCompletions();
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

  getTotalEarnedPoints: () => {
    const { completions } = get();
    return completions.reduce((sum, c) => sum + c.points, 0);
  },

  getTotalSpentPoints: () => {
    const { rewardClaims } = get();
    return rewardClaims
      .filter((claim) => claim.status === 'active')
      .reduce((sum, claim) => sum + claim.pointsSpent, 0);
  },

  getAvailablePoints: () => {
    return get().getTotalEarnedPoints() - get().getTotalSpentPoints();
  },
}));

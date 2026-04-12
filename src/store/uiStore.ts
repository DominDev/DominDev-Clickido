/**
 * UI Store - Zustand store for UI state (modals, toasts, screensaver)
 */

import { create } from 'zustand';
import { Toast, ModalState, Task } from '@/types';

interface UndoBuffer {
  type: 'delete_task' | 'uncomplete_task';
  data: unknown;
  timestamp: number;
}

interface UIState {
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modal
  modal: ModalState;
  openModal: (type: ModalState['type'], data?: unknown) => void;
  closeModal: () => void;

  // Task Form
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;

  // Screensaver
  isScreensaverActive: boolean;
  lastActivityTime: number;
  activateScreensaver: () => void;
  deactivateScreensaver: () => void;
  updateActivityTime: () => void;

  // Undo buffer
  undoBuffer: UndoBuffer | null;
  setUndoBuffer: (buffer: UndoBuffer | null) => void;
  executeUndo: () => void;
}

let toastIdCounter = 0;

export const useUIStore = create<UIState>((set, get) => ({
  // Toasts
  toasts: [],

  addToast: (toast) => {
    const id = `toast_${++toastIdCounter}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Modal
  modal: {
    isOpen: false,
    type: null,
    data: undefined,
  },

  openModal: (type, data) => {
    set({
      modal: {
        isOpen: true,
        type,
        data,
      },
    });
  },

  closeModal: () => {
    set({
      modal: {
        isOpen: false,
        type: null,
        data: undefined,
      },
      editingTask: null,
    });
  },

  // Task Form
  editingTask: null,

  setEditingTask: (task) => {
    set({ editingTask: task });
  },

  // Screensaver
  isScreensaverActive: false,
  lastActivityTime: Date.now(),

  activateScreensaver: () => {
    set({ isScreensaverActive: true });
  },

  deactivateScreensaver: () => {
    set({
      isScreensaverActive: false,
      lastActivityTime: Date.now(),
    });
  },

  updateActivityTime: () => {
    set({ lastActivityTime: Date.now() });
  },

  // Undo buffer
  undoBuffer: null,

  setUndoBuffer: (buffer) => {
    set({ undoBuffer: buffer });
  },

  executeUndo: () => {
    const { undoBuffer, toasts, removeToast } = get();

    if (!undoBuffer) return;

    // Find and remove the undo toast
    const undoToast = toasts.find((t) => t.type === 'undo');
    if (undoToast) {
      removeToast(undoToast.id);
    }

    // Execute undo based on type
    if (undoBuffer.type === 'delete_task' && undoBuffer.data) {
      // Re-add the deleted task
      // This would be handled by the calling code
    }

    set({ undoBuffer: null });
  },
}));

// Helper function to show undo toast
export function showUndoToast(
  message: string,
  onUndo: () => void,
  duration: number = 5000
): string {
  const { addToast, setUndoBuffer } = useUIStore.getState();

  return addToast({
    message,
    type: 'undo',
    duration,
    onUndo: () => {
      onUndo();
      setUndoBuffer(null);
    },
  });
}

// Helper function to show success toast
export function showSuccessToast(message: string, duration: number = 3000): string {
  return useUIStore.getState().addToast({
    message,
    type: 'success',
    duration,
  });
}

// Helper function to show error toast
export function showErrorToast(message: string, duration: number = 4000): string {
  return useUIStore.getState().addToast({
    message,
    type: 'error',
    duration,
  });
}

// Helper function to show info toast
export function showInfoToast(message: string, duration: number = 3000): string {
  return useUIStore.getState().addToast({
    message,
    type: 'info',
    duration,
  });
}

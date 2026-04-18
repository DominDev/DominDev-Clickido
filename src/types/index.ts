// Task types
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'interval' | 'monthly';

export type CategoryId = 'kitchen' | 'bathroom' | 'living' | 'laundry' | 'shopping' | 'pets' | 'other';

export interface Task {
  id: string;
  title: string;
  emoji: string;
  category: CategoryId;
  estimatedMinutes: number;
  points: number;
  recurrence: RecurrenceType;
  // For 'once' - specific date
  date?: string; // ISO date string YYYY-MM-DD
  // For 'weekly' - days of week (0 = Sunday, 1 = Monday, etc.)
  daysOfWeek?: number[];
  // For 'interval' - every N days
  intervalDays?: number;
  intervalStartDate?: string; // ISO date string
  // For 'monthly' - day of month (1-28)
  dayOfMonth?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  taskId: string;
  date: string; // ISO date string YYYY-MM-DD
  completedAt: string; // ISO datetime string
  points: number;
}

export type RewardAudience = 'child' | 'adult' | 'family';

export interface CustomReward {
  id: string;
  target: number; // cost in points
  emoji: string;
  title: string;
  hint?: string;
  audience: RewardAudience; // who can see this reward
  createdAt: string;
}

export interface ClaimedReward {
  rewardId: string; // CustomReward.id
  rewardTitle: string; // snapshot of title at claim time
  rewardEmoji: string; // snapshot of emoji at claim time
  claimedAt: string; // ISO datetime string
  pointsSpent: number; // points spent on this reward
}

// Category definition
export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  color: string;
}

// Settings types
export interface NightModeSettings {
  enabled: boolean;
  mode: 'auto' | 'manual';
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface ScreensaverSettings {
  enabled: boolean;
  idleTimeoutMinutes: number; // 1-30
  dimOpacity: number; // 10-100
  panelBrightness: number; // 0-100
  showSeconds: boolean;
}

export interface DisplaySettings {
  showTimeEstimate: boolean;
  showPoints: boolean;
  showMotivation: boolean;
  kidsMode: boolean;
  kidsModePin?: string; // 4-digit PIN
}

export interface AppSettings {
  nightMode: NightModeSettings;
  screensaver: ScreensaverSettings;
  display: DisplaySettings;
  dataVersion: number;
}

// UI State types
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'undo';
  duration: number;
  onUndo?: () => void;
}

export interface ModalState {
  isOpen: boolean;
  type: 'taskForm' | 'rewardForm' | 'confirm' | 'export' | 'import' | null;
  data?: unknown;
}

// Template types
export interface TaskTemplate {
  title: string;
  emoji: string;
  category: CategoryId;
  estimatedMinutes: number;
}

/**
 * Storage Service - Abstraction layer for localStorage
 * Designed for future migration to Supabase/Firebase
 */

import { ClaimedReward } from '@/types';

const STORAGE_PREFIX = 'ck_';
const CURRENT_VERSION = 2;

// Storage keys
export const STORAGE_KEYS = {
  TASKS: `${STORAGE_PREFIX}tasks`,
  COMPLETIONS: `${STORAGE_PREFIX}completions`,
  CLAIMED_REWARDS: `${STORAGE_PREFIX}claimed_rewards`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  VERSION: `${STORAGE_PREFIX}version`,
  UNDO_BUFFER: `${STORAGE_PREFIX}undo`,
  ONBOARDING_COMPLETE: `${STORAGE_PREFIX}onboarding_complete`,
  INSTALL_BANNER_DISMISSED: `${STORAGE_PREFIX}install_banner_dismissed`,
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Get item from localStorage with JSON parsing
 */
export function getItem<T>(key: StorageKey, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage [${key}]:`, error);
    return defaultValue;
  }
}

/**
 * Set item in localStorage with JSON stringification
 */
export function setItem<T>(key: StorageKey, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage [${key}]:`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeItem(key: StorageKey): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage [${key}]:`, error);
    return false;
  }
}

/**
 * Clear all Clickido data from localStorage
 */
export function clearAll(): boolean {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Export all data as JSON string
 */
export function exportData(): string {
  const data = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: getItem(STORAGE_KEYS.TASKS, []),
    completions: getItem(STORAGE_KEYS.COMPLETIONS, []),
    claimedRewards: getItem(STORAGE_KEYS.CLAIMED_REWARDS, []),
    settings: getItem(STORAGE_KEYS.SETTINGS, null),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON string
 */
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    // Validate structure
    if (!data.version || !Array.isArray(data.tasks)) {
      throw new Error('Invalid data format');
    }

    // Import data
    setItem(STORAGE_KEYS.TASKS, data.tasks);
    setItem(STORAGE_KEYS.COMPLETIONS, data.completions || []);

    // Handle claimedRewards migration from old format (number[]) to new format (ClaimedReward[])
    if (data.claimedRewards) {
      const migratedRewards = migrateClaimedRewards(data.claimedRewards);
      setItem(STORAGE_KEYS.CLAIMED_REWARDS, migratedRewards);
    }

    if (data.settings) {
      setItem(STORAGE_KEYS.SETTINGS, data.settings);
    }
    setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

/**
 * Migrate claimed rewards from old format (number[]) to new format (ClaimedReward[])
 */
function migrateClaimedRewards(rewards: unknown): ClaimedReward[] {
  if (!Array.isArray(rewards)) {
    return [];
  }

  // Check if already in new format
  if (rewards.length > 0 && typeof rewards[0] === 'object' && rewards[0] !== null && 'target' in rewards[0]) {
    return rewards as ClaimedReward[];
  }

  // Convert from old format (number[]) to new format (ClaimedReward[])
  return rewards
    .filter((item): item is number => typeof item === 'number')
    .map((target) => ({
      target,
      claimedAt: new Date().toISOString(),
      pointsSpent: target,
    }));
}

/**
 * Check and run migrations if needed
 */
export function runMigrations(): void {
  const storedVersion = getItem(STORAGE_KEYS.VERSION, 0);

  if (storedVersion < CURRENT_VERSION) {
    // Migration v1 -> v2: Convert claimed rewards from number[] to ClaimedReward[]
    if (storedVersion < 2) {
      const oldRewards = getItem<unknown>(STORAGE_KEYS.CLAIMED_REWARDS, []);
      const migratedRewards = migrateClaimedRewards(oldRewards);
      setItem(STORAGE_KEYS.CLAIMED_REWARDS, migratedRewards);
      console.log('Migrated claimed rewards to new format');
    }

    setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    console.log(`Migrated storage from v${storedVersion} to v${CURRENT_VERSION}`);
  }
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { used: number; available: number } {
  let used = 0;
  Object.values(STORAGE_KEYS).forEach((key) => {
    const item = localStorage.getItem(key);
    if (item) {
      used += item.length * 2; // UTF-16 = 2 bytes per char
    }
  });

  // Estimate 5MB limit for localStorage
  const available = 5 * 1024 * 1024 - used;

  return { used, available };
}

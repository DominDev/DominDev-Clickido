/**
 * Storage Service - Abstraction layer for localStorage
 * Designed for future migration to Supabase/Firebase
 */

const STORAGE_PREFIX = 'ck_';
const CURRENT_VERSION = 1;

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
    if (data.settings) {
      setItem(STORAGE_KEYS.SETTINGS, data.settings);
    }
    setItem(STORAGE_KEYS.VERSION, data.version);

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

/**
 * Check and run migrations if needed
 */
export function runMigrations(): void {
  const storedVersion = getItem(STORAGE_KEYS.VERSION, 0);

  if (storedVersion < CURRENT_VERSION) {
    // Run migrations here when needed
    // For now, just update version
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

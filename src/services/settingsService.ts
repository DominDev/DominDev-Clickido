/**
 * Settings Service - User preferences management
 */

import { AppSettings, NightModeSettings, ScreensaverSettings, DisplaySettings } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from './storageService';

/**
 * Default settings
 */
const DEFAULT_SETTINGS: AppSettings = {
  nightMode: {
    enabled: false,
    mode: 'auto',
    startHour: 22,
    endHour: 6,
  },
  screensaver: {
    enabled: true,
    idleTimeoutMinutes: 5,
    dimOpacity: 30,
    panelBrightness: 58,
    showSeconds: false,
  },
  display: {
    showTimeEstimate: true,
    showPoints: true,
    showMotivation: true,
    kidsMode: false,
    kidsModePin: undefined,
  },
  dataVersion: 1,
};

/**
 * Get all settings
 */
export function getSettings(): AppSettings {
  const stored = getItem<Partial<AppSettings> | null>(STORAGE_KEYS.SETTINGS, null);

  if (!stored) {
    return DEFAULT_SETTINGS;
  }

  // Merge with defaults to handle missing fields
  return {
    nightMode: { ...DEFAULT_SETTINGS.nightMode, ...stored.nightMode },
    screensaver: { ...DEFAULT_SETTINGS.screensaver, ...stored.screensaver },
    display: { ...DEFAULT_SETTINGS.display, ...stored.display },
    dataVersion: stored.dataVersion ?? DEFAULT_SETTINGS.dataVersion,
  };
}

/**
 * Save all settings
 */
export function saveSettings(settings: AppSettings): boolean {
  return setItem(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Update night mode settings
 */
export function updateNightMode(updates: Partial<NightModeSettings>): AppSettings {
  const settings = getSettings();
  settings.nightMode = { ...settings.nightMode, ...updates };
  saveSettings(settings);
  return settings;
}

/**
 * Update screensaver settings
 */
export function updateScreensaver(updates: Partial<ScreensaverSettings>): AppSettings {
  const settings = getSettings();
  settings.screensaver = { ...settings.screensaver, ...updates };
  saveSettings(settings);
  return settings;
}

/**
 * Update display settings
 */
export function updateDisplay(updates: Partial<DisplaySettings>): AppSettings {
  const settings = getSettings();
  settings.display = { ...settings.display, ...updates };
  saveSettings(settings);
  return settings;
}

/**
 * Toggle night mode
 */
export function toggleNightMode(): boolean {
  const settings = getSettings();
  const newEnabled = !settings.nightMode.enabled;
  settings.nightMode.enabled = newEnabled;
  settings.nightMode.mode = 'manual'; // Manual override
  saveSettings(settings);
  return newEnabled;
}

/**
 * Check if night mode should be active based on time
 */
export function isNightModeActiveByTime(): boolean {
  const settings = getSettings();
  const { mode, startHour, endHour } = settings.nightMode;

  if (mode !== 'auto') {
    return settings.nightMode.enabled;
  }

  const now = new Date();
  const currentHour = now.getHours();

  // Handle overnight range (e.g., 22:00 - 06:00)
  if (startHour > endHour) {
    return currentHour >= startHour || currentHour < endHour;
  }

  // Same day range (e.g., 18:00 - 22:00)
  return currentHour >= startHour && currentHour < endHour;
}

/**
 * Toggle kids mode (requires PIN verification for disable)
 */
export function toggleKidsMode(pin?: string): { success: boolean; kidsMode: boolean } {
  const settings = getSettings();

  // If turning off, verify PIN
  if (settings.display.kidsMode && settings.display.kidsModePin) {
    if (pin !== settings.display.kidsModePin) {
      return { success: false, kidsMode: true };
    }
  }

  settings.display.kidsMode = !settings.display.kidsMode;
  saveSettings(settings);

  return { success: true, kidsMode: settings.display.kidsMode };
}

/**
 * Set kids mode PIN
 */
export function setKidsModePin(pin: string): boolean {
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return false;
  }

  const settings = getSettings();
  settings.display.kidsModePin = pin;
  saveSettings(settings);
  return true;
}

/**
 * Clear kids mode PIN
 */
export function clearKidsModePin(): AppSettings {
  const settings = getSettings();
  settings.display.kidsModePin = undefined;
  saveSettings(settings);
  return settings;
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): AppSettings {
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * Get default settings (for reference)
 */
export function getDefaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS };
}

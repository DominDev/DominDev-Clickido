/**
 * Settings Store - Zustand store for app settings
 */

import { create } from 'zustand';
import { AppSettings, NightModeSettings, ScreensaverSettings, DisplaySettings } from '@/types';
import * as settingsService from '@/services/settingsService';

interface SettingsState extends AppSettings {
  // Computed state
  isNightModeActive: boolean;
  screensaverEnabled: boolean;

  // Actions
  loadSettings: () => void;
  updateNightMode: (updates: Partial<NightModeSettings>) => void;
  updateScreensaver: (updates: Partial<ScreensaverSettings>) => void;
  updateDisplay: (updates: Partial<DisplaySettings>) => void;
  toggleNightMode: () => void;
  toggleKidsMode: (pin?: string) => { success: boolean; kidsMode: boolean };
  setKidsModePin: (pin: string) => boolean;
  clearKidsModePin: () => void;
  resetSettings: () => void;

  // Night mode time checker
  checkNightModeTime: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state from defaults
  ...settingsService.getDefaultSettings(),
  isNightModeActive: false,
  screensaverEnabled: true,

  loadSettings: () => {
    const settings = settingsService.getSettings();
    const isNightModeActive = settingsService.isNightModeActiveByTime();

    set({
      ...settings,
      isNightModeActive,
      screensaverEnabled: settings.screensaver.enabled,
    });
  },

  updateNightMode: (updates) => {
    const settings = settingsService.updateNightMode(updates);
    const isNightModeActive = settingsService.isNightModeActiveByTime();

    set({
      nightMode: settings.nightMode,
      isNightModeActive,
    });
  },

  updateScreensaver: (updates) => {
    const settings = settingsService.updateScreensaver(updates);

    set({
      screensaver: settings.screensaver,
      screensaverEnabled: settings.screensaver.enabled,
    });
  },

  updateDisplay: (updates) => {
    const settings = settingsService.updateDisplay(updates);

    set({
      display: settings.display,
    });
  },

  toggleNightMode: () => {
    const isEnabled = settingsService.toggleNightMode();
    const settings = settingsService.getSettings();

    set({
      nightMode: settings.nightMode,
      isNightModeActive: isEnabled,
    });
  },

  toggleKidsMode: (pin) => {
    const result = settingsService.toggleKidsMode(pin);

    if (result.success) {
      const settings = settingsService.getSettings();
      set({ display: settings.display });
    }

    return result;
  },

  setKidsModePin: (pin) => {
    const success = settingsService.setKidsModePin(pin);

    if (success) {
      const settings = settingsService.getSettings();
      set({ display: settings.display });
    }

    return success;
  },

  clearKidsModePin: () => {
    const settings = settingsService.clearKidsModePin();
    set({ display: settings.display });
  },

  resetSettings: () => {
    const settings = settingsService.resetSettings();
    const isNightModeActive = settingsService.isNightModeActiveByTime();

    set({
      ...settings,
      isNightModeActive,
      screensaverEnabled: settings.screensaver.enabled,
    });
  },

  checkNightModeTime: () => {
    const { nightMode } = get();

    if (nightMode.mode === 'auto') {
      const isNightModeActive = settingsService.isNightModeActiveByTime();
      set({ isNightModeActive });
    }
  },
}));

/**
 * useTheme - Hook for managing theme (day/night mode)
 */

import { useEffect } from 'react';
import { useSettingsStore } from '@store/settingsStore';

export function useTheme() {
  const { isNightModeActive, nightMode, display, checkNightModeTime } = useSettingsStore();

  // Apply theme to document
  useEffect(() => {
    if (isNightModeActive) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isNightModeActive]);

  // Apply kids mode
  useEffect(() => {
    if (display.kidsMode) {
      document.documentElement.setAttribute('data-kids-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-kids-mode');
    }
  }, [display.kidsMode]);

  // Check night mode time periodically (for auto mode)
  useEffect(() => {
    if (nightMode.mode !== 'auto') return;

    // Check every minute
    const interval = setInterval(() => {
      checkNightModeTime();
    }, 60000);

    // Initial check
    checkNightModeTime();

    return () => clearInterval(interval);
  }, [nightMode.mode, checkNightModeTime]);

  return { isNightModeActive };
}

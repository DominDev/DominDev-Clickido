/**
 * useScreensaver - Hook for managing screensaver activation
 */

import { useEffect, useCallback } from 'react';
import { useUIStore } from '@store/uiStore';
import { useSettingsStore } from '@store/settingsStore';

export function useScreensaver() {
  const { screensaver } = useSettingsStore();
  const {
    isScreensaverActive,
    lastActivityTime,
    activateScreensaver,
    deactivateScreensaver,
    updateActivityTime,
  } = useUIStore();

  const handleActivity = useCallback(() => {
    if (isScreensaverActive) {
      deactivateScreensaver();
    } else {
      updateActivityTime();
    }
  }, [isScreensaverActive, deactivateScreensaver, updateActivityTime]);

  // Listen for user activity
  useEffect(() => {
    if (!screensaver.enabled) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [screensaver.enabled, handleActivity]);

  // Check for idle timeout
  useEffect(() => {
    if (!screensaver.enabled || isScreensaverActive) return;

    const timeoutMs = screensaver.idleTimeoutMinutes * 60 * 1000;

    const checkIdle = () => {
      const idleTime = Date.now() - lastActivityTime;
      if (idleTime >= timeoutMs) {
        activateScreensaver();
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkIdle, 10000);

    return () => clearInterval(interval);
  }, [
    screensaver.enabled,
    screensaver.idleTimeoutMinutes,
    isScreensaverActive,
    lastActivityTime,
    activateScreensaver,
  ]);

  return {
    isScreensaverActive,
    activateScreensaver,
    deactivateScreensaver,
  };
}

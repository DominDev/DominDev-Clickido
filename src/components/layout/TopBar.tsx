/**
 * TopBar - Header with date, clock, and progress ring
 */

import { useEffect, useMemo, useState } from 'react';
import { isToday } from 'date-fns';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showInfoToast, showSuccessToast } from '@store/uiStore';
import { capitalize, formatTime } from '@utils/formatting';
import ProgressRing from '../ui/ProgressRing';
import { PinModal } from '../ui';
import styles from './TopBar.module.css';

export default function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [parentPinOpen, setParentPinOpen] = useState(false);
  const [progressDisplayMode, setProgressDisplayMode] = useState<'percentage' | 'fraction'>('percentage');
  const { selectedDate, getProgressForSelectedDate, setSelectedDate, getCurrentStreak } = useTaskStore();
  const { screensaver, display, toggleKidsMode } = useSettingsStore();

  const progress = getProgressForSelectedDate();
  const streak = getCurrentStreak();
  const formattedTime = formatTime(currentTime, screensaver.showSeconds);
  const selectedDayIsToday = isToday(selectedDate);
  const kidsDayTitle = capitalize(
    new Intl.DateTimeFormat('pl-PL', {
      weekday: 'long',
    }).format(selectedDate)
  );

  useEffect(() => {
    const intervalMs = screensaver.showSeconds ? 1000 : 60000;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [screensaver.showSeconds]);

  const handleParentExit = () => {
    if (!display.kidsMode) {
      return;
    }

    if (!display.kidsModePin) {
      const result = toggleKidsMode();
      if (result.success) {
        showInfoToast('Tryb dziecięcy został wyłączony.');
      }
      return;
    }

    setParentPinOpen(true);
  };

  const handlePinSubmit = (pin: string): boolean => {
    const result = toggleKidsMode(pin);
    if (result.success) {
      setParentPinOpen(false);
      showSuccessToast('Powrót do trybu dla dorosłych został odblokowany.');
      return true;
    }
    return false;
  };

  const toggleProgressDisplay = () => {
    setProgressDisplayMode((current) => (current === 'percentage' ? 'fraction' : 'percentage'));
  };

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Dzień dobry!';
    if (hour < 18) return 'Cześć!';
    return 'Dobry wieczór!';
  }, [currentTime]);

  return (
    <header className={`${styles.topbar} ${display.kidsMode ? styles.kidsMode : ''}`}>
      <div className={styles.leading}>
        {display.kidsMode ? (
          <div className={styles.kidsHeader}>
            <span className={styles.kidsTitle}>{`🧸 ${kidsDayTitle}`}</span>
          </div>
        ) : (
          <div className={styles.parentGreeting}>
            <span className={styles.greetingTitle}>{greeting}</span>
            <span className={styles.greetingSubtitle}>
              {progress.completed}/{progress.total} dziś · 🔥 {streak} dni
            </span>
          </div>
        )}
      </div>

      <div className={styles.trailing}>
        {!selectedDayIsToday && (
          <button
            type="button"
            className={styles.todayButton}
            onClick={() => setSelectedDate(new Date())}
            aria-label="Wróć do dzisiejszego planu"
          >
            Wróć do dziś
          </button>
        )}

        {display.kidsMode ? (
          <div className={styles.clockSection}>
            <span className={styles.clock}>{formattedTime}</span>
          </div>
        ) : null}

        {display.kidsMode && (
          <>
            <button
              type="button"
              className={styles.parentExitButton}
              onClick={handleParentExit}
              aria-label="Wejście do trybu rodzica"
              title="Dla rodzica"
            >
              <span className={styles.parentExitIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path
                    d="M12 3.75 5.5 6.5v4.35c0 4.1 2.46 7.9 6.27 9.66a.55.55 0 0 0 .46 0c3.81-1.76 6.27-5.56 6.27-9.66V6.5L12 3.75Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <PinModal
              isOpen={parentPinOpen}
              onClose={() => setParentPinOpen(false)}
              onSubmit={handlePinSubmit}
              title="Tryb rodzica"
              description="Wprowadź PIN, aby wyłączyć tryb dziecięcy."
              submitLabel="Odblokuj"
            />
          </>
        )}

        {!display.kidsMode && (
          <div className={styles.progressSection}>
            <div className={styles.clockWrapper}>
              <span className={styles.parentClock}>{formattedTime}</span>
            </div>
            <ProgressRing
              percentage={progress.percentage}
              size={52}
              strokeWidth={4}
              displayMode={progressDisplayMode}
              completed={progress.completed}
              total={progress.total}
              onClick={toggleProgressDisplay}
              label={`Postęp dnia: ${progress.completed} z ${progress.total} zadań, ${progress.percentage}%. Kliknij, aby przełączyć widok.`}
            />
          </div>
        )}
      </div>
    </header>
  );
}

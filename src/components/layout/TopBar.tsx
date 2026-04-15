/**
 * TopBar - Header with date, clock, and progress ring
 */

import { useEffect, useState } from 'react';
import { isToday } from 'date-fns';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showInfoToast, showSuccessToast } from '@store/uiStore';
import { capitalize, formatDateFull, formatTime } from '@utils/formatting';
import ProgressRing from '../ui/ProgressRing';
import { PinModal } from '../ui';
import styles from './TopBar.module.css';

export default function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [parentPinOpen, setParentPinOpen] = useState(false);
  const { selectedDate, getProgressForSelectedDate, setSelectedDate } = useTaskStore();
  const { screensaver, display, toggleKidsMode } = useSettingsStore();

  const progress = getProgressForSelectedDate();
  const formattedDate = capitalize(formatDateFull(selectedDate));
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

  return (
    <header className={`${styles.topbar} ${display.kidsMode ? styles.kidsMode : ''}`}>
      <div className={styles.leading}>
        <div className={styles.dateSection}>
          {display.kidsMode ? (
            <span className={styles.kidsTitle}>{`🧸 ${kidsDayTitle}`}</span>
          ) : (
            <>
              <span className={styles.date}>{formattedDate}</span>
              <span className={styles.dayStatus}>
                {!selectedDayIsToday
                  ? progress.total === 0
                    ? 'Podgląd innego dnia · brak zadań'
                    : `Podgląd innego dnia · ${progress.completed}/${progress.total} zadań ukończonych`
                  : progress.total === 0
                    ? 'Brak zadań na wybrany dzień'
                    : `${progress.completed}/${progress.total} zadań ukończonych`}
              </span>
            </>
          )}
        </div>
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

        <div className={styles.clockSection}>
          <span className={styles.clock}>{formattedTime}</span>
          {!display.kidsMode && <span className={styles.clockHint}>{`${progress.percentage}% planu gotowe`}</span>}
        </div>

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
            <ProgressRing
              percentage={progress.percentage}
              size={56}
              strokeWidth={4}
              label={`Postęp dnia: ${progress.completed} z ${progress.total} zadań, ${progress.percentage}%`}
            />
          </div>
        )}
      </div>
    </header>
  );
}

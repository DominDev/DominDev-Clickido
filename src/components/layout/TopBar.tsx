/**
 * TopBar - Header with date, clock, and progress ring
 */

import { useEffect, useState } from 'react';
import { isToday } from 'date-fns';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showErrorToast, showInfoToast, showSuccessToast } from '@store/uiStore';
import { capitalize, formatDateFull, formatTime } from '@utils/formatting';
import ProgressRing from '../ui/ProgressRing';
import styles from './TopBar.module.css';

export default function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { selectedDate, getProgressForSelectedDate, setSelectedDate } = useTaskStore();
  const { screensaver, display, toggleKidsMode } = useSettingsStore();

  const progress = getProgressForSelectedDate();
  const formattedDate = capitalize(formatDateFull(selectedDate));
  const formattedTime = formatTime(currentTime, screensaver.showSeconds);
  const selectedDayIsToday = isToday(selectedDate);

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

    const enteredPin = window.prompt('Wpisz PIN rodzica, aby wyjść z trybu dziecięcego:');

    if (enteredPin === null) {
      return;
    }

    const result = toggleKidsMode(enteredPin.trim());

    if (result.success) {
      showSuccessToast('Powrót do trybu dla dorosłych został odblokowany.');
      return;
    }

    showErrorToast('Nieprawidłowy PIN rodzica.');
  };

  return (
    <header className={`${styles.topbar} ${display.kidsMode ? styles.kidsMode : ''}`}>
      <div className={styles.leading}>
        {display.kidsMode && (
          <span className={styles.kidsBadge}>{selectedDayIsToday ? '🧸 Dziś' : '🧭 Inny dzień'}</span>
        )}
        <div className={styles.dateSection}>
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

        {display.kidsMode && (
          <button
            type="button"
            className={styles.parentExitButton}
            onClick={handleParentExit}
            aria-label="Wyjdź z trybu dziecięcego jako rodzic"
          >
            Dla rodzica
          </button>
        )}

        <div className={styles.clockSection}>
          <span className={styles.clock}>{formattedTime}</span>
          <span className={styles.clockHint}>
            {display.kidsMode ? 'Damy radę!' : `${progress.percentage}% planu gotowe`}
          </span>
        </div>

        <div className={styles.progressSection}>
          <ProgressRing
            percentage={progress.percentage}
            size={display.kidsMode ? 64 : 56}
            strokeWidth={display.kidsMode ? 5 : 4}
            label={`Postęp dnia: ${progress.completed} z ${progress.total} zadań, ${progress.percentage}%`}
          />
        </div>
      </div>
    </header>
  );
}

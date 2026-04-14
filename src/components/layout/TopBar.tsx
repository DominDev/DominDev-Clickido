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
  const [parentPinOpen, setParentPinOpen] = useState(false);
  const [parentPinValue, setParentPinValue] = useState('');
  const [parentPinError, setParentPinError] = useState<string | null>(null);
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

    setParentPinOpen((current) => !current);
    setParentPinValue('');
    setParentPinError(null);
  };

  const handleUnlockWithPin = () => {
    const result = toggleKidsMode(parentPinValue.trim());

    if (result.success) {
      setParentPinOpen(false);
      setParentPinValue('');
      setParentPinError(null);
      showSuccessToast('Powrót do trybu dla dorosłych został odblokowany.');
      return;
    }

    setParentPinError('Nieprawidłowy PIN rodzica.');
    showErrorToast('Nieprawidłowy PIN rodzica.');
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

        {display.kidsMode && (
          <div className={styles.parentExitWrap}>
            <button
              type="button"
              className={styles.parentExitButton}
              onClick={handleParentExit}
              aria-label="Wejście do trybu rodzica"
              aria-expanded={display.kidsModePin ? parentPinOpen : undefined}
              title="Dla rodzica"
            >
              <span aria-hidden="true">🔒</span>
            </button>

            {display.kidsModePin && parentPinOpen && (
              <div className={styles.parentPinPanel} role="group" aria-label="Odblokowanie trybu rodzica">
                <label className={styles.parentPinLabel}>
                  <span>PIN rodzica</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={4}
                    className={styles.parentPinInput}
                    value={parentPinValue}
                    onChange={(event) => {
                      setParentPinValue(event.target.value.replace(/\D/g, '').slice(0, 4));
                      if (parentPinError) {
                        setParentPinError(null);
                      }
                    }}
                    placeholder="1234"
                  />
                </label>

                <div className={styles.parentPinActions}>
                  <button type="button" className={styles.parentPinConfirm} onClick={handleUnlockWithPin}>
                    Odblokuj
                  </button>
                  <button
                    type="button"
                    className={styles.parentPinCancel}
                    onClick={() => {
                      setParentPinOpen(false);
                      setParentPinValue('');
                      setParentPinError(null);
                    }}
                  >
                    Anuluj
                  </button>
                </div>

                {parentPinError && <p className={styles.parentPinError}>{parentPinError}</p>}
              </div>
            )}
          </div>
        )}

        <div className={styles.clockSection}>
          <span className={styles.clock}>{formattedTime}</span>
          {!display.kidsMode && <span className={styles.clockHint}>{`${progress.percentage}% planu gotowe`}</span>}
        </div>

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

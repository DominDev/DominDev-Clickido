import { useEffect, useMemo, useState } from 'react';
import { useUIStore } from '@store/uiStore';
import { useTaskStore } from '@store/taskStore';
import { useSettingsStore } from '@store/settingsStore';
import {
  formatTasksCount,
  formatTime,
  formatDateFull,
  getMotivationalMessage,
} from '@utils/formatting';
import styles from './Screensaver.module.css';

export default function Screensaver() {
  const [now, setNow] = useState(new Date());
  const { isScreensaverActive, deactivateScreensaver } = useUIStore();
  const {
    getTasksForSelectedDate,
    getProgressForSelectedDate,
    getPointsForSelectedDate,
  } = useTaskStore();
  const { screensaver, isNightModeActive } = useSettingsStore();

  const progress = getProgressForSelectedDate();
  const points = getPointsForSelectedDate();
  const tasks = getTasksForSelectedDate();

  useEffect(() => {
    if (!isScreensaverActive) {
      return undefined;
    }

    const intervalMs = screensaver.showSeconds ? 1000 : 30000;
    const interval = setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isScreensaverActive, screensaver.showSeconds]);

  const formattedDate = useMemo(() => formatDateFull(now), [now]);
  const completedText = `${progress.completed} z ${progress.total} zrobione`;
  const motivation = getMotivationalMessage(progress.percentage);
  const overlayOpacity = isNightModeActive
    ? Math.max(0.12, (screensaver.dimOpacity / 100) * 0.7)
    : screensaver.dimOpacity / 100;

  if (!isScreensaverActive) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.overlay}
      style={{ '--screensaver-dim': overlayOpacity } as React.CSSProperties}
      onClick={deactivateScreensaver}
      aria-label="Wyłącz wygaszacz"
    >
      <div className={styles.backdrop} aria-hidden="true" />

      <div className={styles.panel}>
        <span className={styles.label}>Clickido</span>
        <div className={styles.clock}>{formatTime(now, screensaver.showSeconds)}</div>
        <div className={styles.date}>{formattedDate}</div>

        <div className={styles.progressSection}>
          <div className={styles.progressBar} aria-hidden="true">
            <div
              className={styles.progressFill}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className={styles.progressMeta}>
            <strong>{progress.percentage}%</strong>
            <span>{completedText}</span>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statBlock}>
            <strong>{formatTasksCount(tasks.length)}</strong>
            <span>zaplanowane dziś</span>
          </div>
          <div className={styles.statBlock}>
            <strong>{points}</strong>
            <span>punktów dzisiaj</span>
          </div>
        </div>

        <p className={styles.message}>💪 {motivation}</p>
        <p className={styles.hint}>Dotknij ekranu, aby wrócić do aplikacji.</p>
      </div>
    </button>
  );
}

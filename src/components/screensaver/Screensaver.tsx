import { useEffect, useState } from 'react';
import { useUIStore } from '@store/uiStore';
import { useTaskStore } from '@store/taskStore';
import { useSettingsStore } from '@store/settingsStore';
import { formatTime } from '@utils/formatting';
import styles from './Screensaver.module.css';

export default function Screensaver() {
  const [now, setNow] = useState(new Date());
  const { isScreensaverActive, deactivateScreensaver } = useUIStore();
  const { getProgressForSelectedDate, getPointsForSelectedDate } = useTaskStore();
  const { screensaver } = useSettingsStore();

  const progress = getProgressForSelectedDate();
  const points = getPointsForSelectedDate();

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

  if (!isScreensaverActive) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.overlay}
      style={{ backgroundColor: `rgba(0, 0, 0, ${screensaver.dimOpacity / 100})` }}
      onClick={deactivateScreensaver}
      aria-label="Wyłącz wygaszacz"
    >
      <div className={styles.panel}>
        <span className={styles.label}>Clickido</span>
        <div className={styles.clock}>{formatTime(now, screensaver.showSeconds)}</div>
        <div className={styles.stats}>
          <div className={styles.statBlock}>
            <strong>{progress.percentage}%</strong>
            <span>postępu dnia</span>
          </div>
          <div className={styles.statBlock}>
            <strong>{points}</strong>
            <span>punktów dzisiaj</span>
          </div>
        </div>
        <p className={styles.hint}>Dotknij ekranu, aby wrócić do aplikacji.</p>
      </div>
    </button>
  );
}

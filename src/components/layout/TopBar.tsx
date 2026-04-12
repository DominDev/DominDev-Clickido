/**
 * TopBar - Header with date, clock, and progress ring
 */

import { useState, useEffect } from 'react';
import { useTaskStore } from '@store/taskStore';
import { useSettingsStore } from '@store/settingsStore';
import { formatDateFull, formatTime, capitalize } from '@utils/formatting';
import ProgressRing from '../ui/ProgressRing';
import styles from './TopBar.module.css';

export default function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { selectedDate, getProgressForSelectedDate } = useTaskStore();
  const { screensaver } = useSettingsStore();

  const progress = getProgressForSelectedDate();

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = capitalize(formatDateFull(selectedDate));
  const formattedTime = formatTime(currentTime, screensaver.showSeconds);

  return (
    <header className={styles.topbar}>
      <div className={styles.dateSection}>
        <span className={styles.date}>{formattedDate}</span>
      </div>

      <div className={styles.clockSection}>
        <span className={styles.clock}>{formattedTime}</span>
      </div>

      <div className={styles.progressSection}>
        <ProgressRing
          percentage={progress.percentage}
          size={52}
          strokeWidth={4}
        />
      </div>
    </header>
  );
}

import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTaskStore } from '@store/taskStore';
import { useSettingsStore } from '@store/settingsStore';
import { useUIStore } from '@store/uiStore';
import { DayStrip } from '@components/layout';
import { TaskList } from '@components/task';
import {
  formatPoints,
  formatTasksCount,
  getMotivationalMessage,
} from '@utils/formatting';
import styles from './TodayPage.module.css';

export default function TodayPage() {
  const {
    getTasksForSelectedDate,
    getProgressForSelectedDate,
    getPointsForSelectedDate,
    selectedDate,
  } = useTaskStore();
  const { display } = useSettingsStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();

  const tasks = getTasksForSelectedDate();
  const progress = getProgressForSelectedDate();
  const points = getPointsForSelectedDate();

  const summaryText = useMemo(() => {
    return `${progress.completed}/${progress.total} ukończone · ${formatPoints(points)}`;
  }, [progress.completed, progress.total, points]);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(selectedDate);
  }, [selectedDate]);

  return (
    <section className={styles.page}>
      <DayStrip />

      <div className={styles.content}>
        <div className={styles.headerCard}>
          <div className={styles.titleBlock}>
            <p className={styles.eyebrow}>Plan dnia</p>
            <h1 className={styles.title}>{formattedDate}</h1>
            <p className={styles.subtitle}>{summaryText}</p>
          </div>
          <div className={styles.progressBadge}>{progress.percentage}%</div>
        </div>

        {display.showMotivation && (
          <div className={styles.motivationCard}>
            <strong>{getMotivationalMessage(progress.percentage)}</strong>
            <span>{formatTasksCount(tasks.length)} zaplanowane na wybrany dzień.</span>
          </div>
        )}

        <TaskList
          tasks={tasks}
          emptyTitle="Na dziś nie ma jeszcze żadnych zadań"
          emptyMessage="Dodaj pierwsze zadanie albo przejdź do bazy zadań i skorzystaj z gotowych szablonów. Ten ekran ma być prosty także dla dzieci."
          emptyPrimaryAction={{
            label: '➕ Dodaj zadanie',
            onClick: () => openModal('taskForm'),
          }}
          emptySecondaryAction={{
            label: '📦 Otwórz bazę zadań',
            onClick: () => navigate('/tasks'),
          }}
        />
      </div>

      <div className={styles.floatingActions}>
        <Link className={styles.secondaryAction} to="/tasks">
          Baza zadań
        </Link>
        <button
          type="button"
          className={styles.fab}
          onClick={() => openModal('taskForm')}
          aria-label="Dodaj nowe zadanie"
        >
          <span aria-hidden="true">＋</span>
        </button>
      </div>
    </section>
  );
}

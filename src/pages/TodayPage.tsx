import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DayStrip } from '@components/layout';
import { TaskList } from '@components/task';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { useUIStore } from '@store/uiStore';
import {
  formatPoints,
  formatTasksCount,
  getMotivationalMessage,
} from '@utils/formatting';
import styles from './TodayPage.module.css';

function getKidsMood(progressPercentage: number, pendingTasks: number) {
  if (pendingTasks === 0) {
    return {
      emoji: '🌟',
      title: 'Wszystko gotowe!',
      subtitle: 'Dziś nie ma już nic do zrobienia. Super robota.',
    };
  }

  if (progressPercentage >= 80) {
    return {
      emoji: '🚀',
      title: 'Już prawie koniec!',
      subtitle: 'Jeszcze chwila i cały plan dnia będzie gotowy.',
    };
  }

  if (progressPercentage >= 40) {
    return {
      emoji: '💪',
      title: 'Świetnie Ci idzie',
      subtitle: 'Masz już część zadań za sobą. Lecimy dalej.',
    };
  }

  return {
    emoji: '🧸',
    title: 'Zaczynamy przygodę',
    subtitle: 'Wybierz duży kafelek i stuknij, gdy zadanie będzie zrobione.',
  };
}

export default function TodayPage() {
  const {
    getPointsForSelectedDate,
    getProgressForSelectedDate,
    getTasksForSelectedDate,
    selectedDate,
  } = useTaskStore();
  const { display } = useSettingsStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();

  const tasks = getTasksForSelectedDate();
  const progress = getProgressForSelectedDate();
  const points = getPointsForSelectedDate();
  const pendingTasks = Math.max(progress.total - progress.completed, 0);

  const summaryText = useMemo(
    () => `${progress.completed}/${progress.total} ukończone · ${formatPoints(points)}`,
    [progress.completed, progress.total, points]
  );

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(selectedDate);
  }, [selectedDate]);

  const kidsMood = useMemo(
    () => getKidsMood(progress.percentage, pendingTasks),
    [progress.percentage, pendingTasks]
  );

  return (
    <section className={`${styles.page} ${display.kidsMode ? styles.kidsPage : ''}`}>
      <DayStrip />

      <div className={styles.content}>
        {display.kidsMode ? (
          <>
            <div className={styles.kidsHero}>
              <div className={styles.kidsHeroBubble}>
                <span className={styles.kidsHeroEmoji} aria-hidden="true">
                  {kidsMood.emoji}
                </span>
                <div className={styles.kidsHeroText}>
                  <p className={styles.eyebrow}>Plan na dziś</p>
                  <h1 className={styles.kidsTitle}>{kidsMood.title}</h1>
                  <p className={styles.kidsSubtitle}>{kidsMood.subtitle}</p>
                </div>
              </div>

              <div className={styles.kidsProgressCard}>
                <div className={styles.kidsProgressHeader}>
                  <span className={styles.kidsProgressLabel}>Postęp dnia</span>
                  <strong className={styles.kidsProgressValue}>{progress.percentage}%</strong>
                </div>
                <div className={styles.progressTrack} aria-hidden="true">
                  <div className={styles.progressFill} style={{ width: `${progress.percentage}%` }} />
                </div>
                <div className={styles.kidsStars} aria-hidden="true">
                  <span className={progress.completed >= 1 ? styles.starActive : styles.star}>⭐</span>
                  <span className={progress.completed >= Math.max(1, Math.ceil(progress.total / 2)) ? styles.starActive : styles.star}>⭐</span>
                  <span className={pendingTasks === 0 && progress.total > 0 ? styles.starActive : styles.star}>⭐</span>
                </div>
              </div>
            </div>

            <div className={styles.kidsStatsGrid}>
              <article className={styles.kidsStatCard}>
                <span className={styles.kidsStatEmoji} aria-hidden="true">
                  ✅
                </span>
                <strong className={styles.kidsStatValue}>{progress.completed}</strong>
                <span className={styles.kidsStatLabel}>Zrobione</span>
              </article>

              <article className={styles.kidsStatCard}>
                <span className={styles.kidsStatEmoji} aria-hidden="true">
                  🎯
                </span>
                <strong className={styles.kidsStatValue}>{pendingTasks}</strong>
                <span className={styles.kidsStatLabel}>Jeszcze dziś</span>
              </article>

              <article className={styles.kidsStatCard}>
                <span className={styles.kidsStatEmoji} aria-hidden="true">
                  ⭐
                </span>
                <strong className={styles.kidsStatValue}>{points}</strong>
                <span className={styles.kidsStatLabel}>Punkty</span>
              </article>
            </div>

            <div className={styles.kidsGuideCard}>
              <strong>Jak to działa?</strong>
              <span>Wybierz obrazek zadania i dotknij go, gdy będzie zrobione.</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.headerCard}>
              <div className={styles.titleBlock}>
                <p className={styles.eyebrow}>Plan dnia</p>
                <h1 className={styles.title}>{formattedDate}</h1>
                <p className={styles.subtitle}>{summaryText}</p>
              </div>

              <div className={styles.progressBadge}>{progress.percentage}%</div>
            </div>

            <div className={styles.progressPanel}>
              <div className={styles.progressTrack} aria-hidden="true">
                <div className={styles.progressFill} style={{ width: `${progress.percentage}%` }} />
              </div>

              <div className={styles.quickStats}>
                <div className={styles.quickStatCard}>
                  <span className={styles.quickStatLabel}>Do zrobienia</span>
                  <strong className={styles.quickStatValue}>{pendingTasks}</strong>
                </div>
                <div className={styles.quickStatCard}>
                  <span className={styles.quickStatLabel}>Punkty dziś</span>
                  <strong className={styles.quickStatValue}>{points}</strong>
                </div>
                <div className={styles.quickStatCard}>
                  <span className={styles.quickStatLabel}>Wszystkie zadania</span>
                  <strong className={styles.quickStatValue}>{tasks.length}</strong>
                </div>
              </div>
            </div>

            {display.showMotivation && (
              <div className={styles.motivationCard}>
                <strong>{getMotivationalMessage(progress.percentage)}</strong>
                <span>{formatTasksCount(tasks.length)} zaplanowane na wybrany dzień.</span>
              </div>
            )}
          </>
        )}

        <TaskList
          tasks={tasks}
          emptyTitle={
            display.kidsMode
              ? 'Dziś nie ma już zadań'
              : 'Na dziś nie ma jeszcze żadnych zadań'
          }
          emptyMessage={
            display.kidsMode
              ? 'Świetnie. Możesz odpocząć albo poprosić dorosłego o dodanie nowych kafelków.'
              : 'Dodaj pierwsze zadanie albo przejdź do bazy zadań i skorzystaj z gotowych szablonów. Ten ekran ma być prosty także dla dzieci.'
          }
          emptyPrimaryAction={
            display.kidsMode
              ? undefined
              : {
                  label: '➕ Dodaj zadanie',
                  onClick: () => openModal('taskForm'),
                }
          }
          emptySecondaryAction={{
            label: display.kidsMode ? '📦 Pokaż wszystkie zadania' : '📦 Otwórz bazę zadań',
            onClick: () => navigate('/tasks'),
          }}
        />
      </div>

      {!display.kidsMode && (
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
      )}
    </section>
  );
}

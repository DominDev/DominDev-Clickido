import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isToday } from 'date-fns';
import { DayStrip } from '@components/layout';
import { TaskList } from '@components/task';
import { PointsTile } from '@components/ui';
import { calculatePoints } from '@services/taskService';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showSuccessToast, useUIStore } from '@store/uiStore';
import { getMotivationalMessage } from '@utils/formatting';
import { TASK_TEMPLATES } from '@utils/categories';
import styles from './TodayPage.module.css';

type KidsMood = {
  mood: 'start' | 'happy' | 'excited' | 'done';
  title: string;
  subtitle: string;
};

function getKidsMood(progressPercentage: number, pendingTasks: number): KidsMood {
  if (pendingTasks === 0) {
    return {
      mood: 'done',
      title: 'Brawo!',
      subtitle: 'Na dziś wszystko gotowe.',
    };
  }

  if (progressPercentage >= 80) {
    return {
      mood: 'excited',
      title: 'Już prawie!',
      subtitle: 'Zostało tylko trochę.',
    };
  }

  if (progressPercentage >= 40) {
    return {
      mood: 'happy',
      title: 'Idzie świetnie',
      subtitle: 'Jeszcze kilka kafelków.',
    };
  }

  return {
    mood: 'start',
    title: 'Zaczynamy',
    subtitle: 'Dotknij duży kafelek.',
  };
}

export default function TodayPage() {
  const {
    addTask,
    getPointsForSelectedDate,
    getProgressForSelectedDate,
    getTasksForSelectedDate,
    selectedDate,
    setSelectedDate,
    completions,
  } = useTaskStore();
  const { display } = useSettingsStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();

  const tasks = getTasksForSelectedDate();
  const progress = getProgressForSelectedDate();
  const points = getPointsForSelectedDate();
  const pendingTasks = Math.max(progress.total - progress.completed, 0);
  const selectedDayIsToday = isToday(selectedDate);

  const totalPoints = useMemo(() => completions.reduce((sum, c) => sum + c.points, 0), [completions]);
  const totalCompleted = completions.length;

  useEffect(() => {
    if (display.kidsMode && !selectedDayIsToday) {
      setSelectedDate(new Date());
    }
  }, [display.kidsMode, selectedDayIsToday, setSelectedDate]);

  const kidsMood = useMemo(
    () => getKidsMood(progress.percentage, pendingTasks),
    [progress.percentage, pendingTasks]
  );

  const emptySuggestions = useMemo(
    () => [
      {
        key: 'morning-routine',
        emoji: '🌅',
        title: 'Poranny start',
        description: 'Śniadanie, pościel i szybkie ogarnięcie pokoju.',
        onClick: () => {
          const templates = [
            TASK_TEMPLATES.kitchen[0],
            TASK_TEMPLATES.living[2],
            TASK_TEMPLATES.living[5],
          ];

          templates.forEach((template) => {
            addTask({
              ...template,
              points: calculatePoints(template.estimatedMinutes),
              recurrence: 'daily',
            });
          });

          showSuccessToast('Dodano poranny zestaw startowy.');
        },
      },
      {
        key: 'home-refresh',
        emoji: '✨',
        title: 'Szybkie odświeżenie domu',
        description: 'Kurz, naczynia i śmieci do ogarnięcia od ręki.',
        onClick: () => {
          const templates = [
            TASK_TEMPLATES.living[1],
            TASK_TEMPLATES.kitchen[3],
            TASK_TEMPLATES.kitchen[4],
          ];

          templates.forEach((template) => {
            addTask({
              ...template,
              points: calculatePoints(template.estimatedMinutes),
              recurrence: 'daily',
            });
          });

          showSuccessToast('Dodano szybki zestaw domowy.');
        },
      },
      {
        key: 'evening-routine',
        emoji: '🌙',
        title: 'Wieczorne domknięcie',
        description: 'Kolacja, pies i przygotowanie domu na jutro.',
        onClick: () => {
          const templates = [
            TASK_TEMPLATES.kitchen[2],
            TASK_TEMPLATES.pets[1],
            TASK_TEMPLATES.laundry[3],
          ];

          templates.forEach((template) => {
            addTask({
              ...template,
              points: calculatePoints(template.estimatedMinutes),
              recurrence: 'daily',
            });
          });

          showSuccessToast('Dodano wieczorną rutynę.');
        },
      },
    ],
    [addTask]
  );

  const handleOpenPoints = () => {
    navigate('/points');
  };

  return (
    <section className={`${styles.page} ${display.kidsMode ? styles.kidsPage : ''}`}>
      {!display.kidsMode && <DayStrip />}

      <div className={styles.content}>
        {display.kidsMode ? (
          <>
            <div className={styles.kidsTopRow}>
              <div className={styles.headerCard}>
                <div className={styles.titleBlock}>
                  <p className={styles.eyebrow}>Plan na dziś</p>
                  <h1 className={styles.kidsTitle}>{kidsMood.title}</h1>
                  {pendingTasks > 0 ? (
                    <div className={styles.kidsMiniProgress}>
                      <div className={styles.kidsMiniProgressTrack} aria-hidden="true">
                        <div
                          className={styles.kidsMiniProgressFill}
                          style={{ width: `${Math.max(progress.percentage, 8)}%` }}
                        />
                      </div>
                      <p className={styles.kidsMiniProgressLabel}>
                        {progress.completed}/{progress.total} gotowe
                      </p>
                    </div>
                  ) : (
                    <p className={styles.kidsSubtitle}>Zobacz swoje nagrody.</p>
                  )}
                </div>

                <div
                  className={`${styles.kidsCompanion} ${styles[`kidsCompanion${kidsMood.mood[0].toUpperCase()}${kidsMood.mood.slice(1)}`]}`}
                  aria-hidden="true"
                >
                  <span className={styles.kidsCompanionFace}>
                    <span className={styles.kidsCompanionEyes}>
                      <span />
                      <span />
                    </span>
                    <span className={styles.kidsCompanionMouth} />
                  </span>
                </div>
              </div>

              <PointsTile
                label="Punkty dziś"
                value={display.showPoints ? points : progress.completed}
                subLabel="Zebrane łącznie"
                subValue={display.showPoints ? totalPoints : totalCompleted}
                onClickAction={handleOpenPoints}
              />
            </div>

          </>
        ) : (
          <>
            {display.showMotivation && (
              <div className={styles.motivationCard} data-complete={progress.percentage === 100}>
                <span className={styles.motivationEmoji} aria-hidden="true">
                  {progress.percentage === 100 ? '🎉' : progress.percentage >= 50 ? '🔥' : '💪'}
                </span>
                <div className={styles.motivationContent}>
                  <strong>{getMotivationalMessage(progress.percentage)}</strong>
                  <span>
                    {progress.percentage === 100
                      ? 'Gratulacje! Wszystkie zadania na dziś wykonane.'
                      : `${progress.completed} z ${progress.total} ukończone`}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.progressPanel}>
              <div className={styles.progressPanelHeader}>
                <strong>Postęp dnia</strong>
                <span>{progress.percentage}%</span>
              </div>

              <div className={styles.progressTrack} aria-hidden="true">
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress.percentage}%` }}
                  data-complete={progress.percentage === 100}
                />
              </div>

              <div className={styles.quickStats}>
                <div className={styles.quickStatCard} data-highlight="pending">
                  <span className={styles.quickStatLabel}>Do zrobienia</span>
                  <strong className={styles.quickStatValue}>{pendingTasks}</strong>
                </div>
                <div className={styles.quickStatCard} data-highlight="points">
                  <span className={styles.quickStatLabel}>Punkty dziś</span>
                  <strong className={styles.quickStatValue}>{points}</strong>
                </div>
                <div className={styles.quickStatCard}>
                  <span className={styles.quickStatLabel}>Zaplanowane</span>
                  <strong className={styles.quickStatValue}>{tasks.length}</strong>
                </div>
              </div>
            </div>

            {tasks.length === 0 && selectedDayIsToday && (
              <div className={styles.firstStartCard}>
                <div className={styles.firstStartHeader}>
                  <span className={styles.firstStartEmoji} aria-hidden="true">
                    🌱
                  </span>
                  <div className={styles.firstStartText}>
                    <strong>Najprostszy start na dziś</strong>
                    <span>Nie kombinuj. Zrób trzy małe kroki i aplikacja od razu zacznie mieć sens.</span>
                  </div>
                </div>

                <div className={styles.firstStartSteps}>
                  <div className={styles.firstStartStep}>
                    <span className={styles.firstStartNumber}>1</span>
                    <span>Dodaj jedno szybkie zadanie albo skorzystaj z gotowego zestawu niżej.</span>
                  </div>
                  <div className={styles.firstStartStep}>
                    <span className={styles.firstStartNumber}>2</span>
                    <span>Przejdź do bazy zadań, jeśli chcesz ułożyć stałe obowiązki dla domu.</span>
                  </div>
                  <div className={styles.firstStartStep}>
                    <span className={styles.firstStartNumber}>3</span>
                    <span>Gdy dzieci zaczną klikać zadania, punkty i postęp zaczną działać automatycznie.</span>
                  </div>
                </div>

                <div className={styles.firstStartActions}>
                  <button type="button" className={styles.firstStartSecondary} onClick={() => navigate('/tasks')}>
                    Otwórz bazę zadań
                  </button>
                  <button type="button" className={styles.firstStartPrimary} onClick={() => openModal('taskForm')}>
                    Zacznij od jednego zadania
                  </button>
                </div>
              </div>
            )}

              </>
        )}

        <div>
          <TaskList
            tasks={tasks}
            emptyTitle={
              display.kidsMode ? 'Dziś nie ma już zadań' : 'Na dziś nie ma jeszcze żadnych zadań'
            }
            emptyMessage={
              display.kidsMode
                ? 'Świetnie. Możesz odpocząć albo poprosić dorosłego o dodanie nowych kafelków.'
                : 'Dodaj pierwsze zadanie albo przejdź do bazy zadań i skorzystaj z gotowych szablonów. Ten ekran ma być prosty także dla dzieci.'
            }
            emptySuggestions={emptySuggestions}
            emptyPrimaryAction={
              display.kidsMode
                ? undefined
                : {
                    label: '➕ Dodaj zadanie',
                    onClick: () => openModal('taskForm'),
                  }
            }
            emptySecondaryAction={{
              label: display.kidsMode ? '🏆 Zobacz nagrody' : '📦 Otwórz bazę zadań',
              onClick: () => navigate(display.kidsMode ? '/points' : '/tasks'),
            }}
          />
        </div>
      </div>

    </section>
  );
}

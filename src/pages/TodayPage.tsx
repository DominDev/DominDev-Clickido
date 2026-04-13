import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isToday } from 'date-fns';
import { DayStrip } from '@components/layout';
import { TaskList } from '@components/task';
import { calculatePoints } from '@services/taskService';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showSuccessToast, useUIStore } from '@store/uiStore';
import { formatPoints, formatTasksCount, getMotivationalMessage } from '@utils/formatting';
import { TASK_TEMPLATES } from '@utils/categories';
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
    addTask,
    getPointsForSelectedDate,
    getProgressForSelectedDate,
    getTasksForSelectedDate,
    selectedDate,
    setSelectedDate,
  } = useTaskStore();
  const { display } = useSettingsStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();
  const taskListAnchorRef = useRef<HTMLDivElement | null>(null);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const tasks = getTasksForSelectedDate();
  const progress = getProgressForSelectedDate();
  const points = getPointsForSelectedDate();
  const pendingTasks = Math.max(progress.total - progress.completed, 0);
  const selectedDayIsToday = isToday(selectedDate);
  const showAdultFocusCard = display.kidsMode || tasks.length > 0;
  const showAdultShortcuts = !display.kidsMode && tasks.length > 0;

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

  const primaryNextStep = useMemo(() => {
    if (display.kidsMode) {
      if (tasks.length === 0) {
        return {
          emoji: '🧸',
          title: 'Poproś o nowe zadania',
          description: 'Gdy pojawią się nowe kafelki, stuknij ten, który chcesz zrobić jako pierwszy.',
          actionLabel: '🏆 Zobacz nagrody',
          onAction: () => navigate('/points'),
        };
      }

      if (pendingTasks > 0) {
        return {
          emoji: '👇',
          title: 'Wybierz pierwszy kafelek',
          description: 'Najłatwiej zacząć od jednego zadania niżej. Dotknij, gdy będzie gotowe.',
          actionLabel: 'Przejdź do zadań',
          onAction: () => taskListAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        };
      }

      return {
        emoji: '🌟',
        title: 'Plan na dziś jest gotowy',
        description: 'Możesz sprawdzić swoje punkty albo poczekać na kolejne zadania od rodzica.',
          actionLabel: '🏆 Zobacz nagrody',
          onAction: () => navigate('/points'),
        };
    }

    if (tasks.length === 0) {
      return {
        emoji: '➕',
        title: 'Najpierw dodaj pierwszy zestaw zadań',
        description: 'Pusty dzień nie powinien kończyć się decyzją „co teraz?”. Zacznij od jednej akcji.',
        actionLabel: 'Dodaj zadanie',
        onAction: () => openModal('taskForm'),
      };
    }

    if (pendingTasks > 0) {
      return {
        emoji: '📋',
        title: 'Najważniejsze teraz: dokończyć plan dnia',
        description: `Zostało jeszcze ${pendingTasks} zadań. Najszybciej pomoże przejście prosto do listy poniżej.`,
        actionLabel: 'Przejdź do listy',
        onAction: () => taskListAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      };
    }

    return {
      emoji: '⭐',
      title: 'Dzisiejszy plan jest domknięty',
      description: 'To dobry moment, żeby sprawdzić punkty albo przygotować kolejne zadania.',
      actionLabel: 'Zobacz punkty',
      onAction: () => navigate('/points'),
    };
  }, [display.kidsMode, navigate, openModal, pendingTasks, tasks.length]);

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

  const returnToToday = () => setSelectedDate(new Date());

  const handleOpenQuickTask = () => {
    setQuickMenuOpen(false);
    openModal('taskForm');
  };

  const handleOpenTaskBase = () => {
    setQuickMenuOpen(false);
    navigate('/tasks');
  };

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
                  {!selectedDayIsToday && (
                    <div className={styles.dayContext}>
                      <span className={styles.contextBadge}>🧭 Oglądasz inny dzień</span>
                      <button type="button" className={styles.contextButton} onClick={returnToToday}>
                        Wróć do dziś
                      </button>
                    </div>
                  )}
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
                  <span
                    className={
                      progress.completed >= Math.max(1, Math.ceil(progress.total / 2))
                        ? styles.starActive
                        : styles.star
                    }
                  >
                    ⭐
                  </span>
                  <span className={pendingTasks === 0 && progress.total > 0 ? styles.starActive : styles.star}>
                    ⭐
                  </span>
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
              <div className={styles.kidsGuideSteps}>
                <div className={styles.kidsGuideStep}>
                  <span className={styles.kidsGuideIcon} aria-hidden="true">
                    👀
                  </span>
                  <span>Znajdź obrazek zadania</span>
                </div>
                <div className={styles.kidsGuideStep}>
                  <span className={styles.kidsGuideIcon} aria-hidden="true">
                    ✋
                  </span>
                  <span>Dotknij, gdy zrobione</span>
                </div>
                <div className={styles.kidsGuideStep}>
                  <span className={styles.kidsGuideIcon} aria-hidden="true">
                    ⭐
                  </span>
                  <span>Zbieraj punkty i gwiazdki</span>
                </div>
              </div>
            </div>

            {showAdultFocusCard && (
              <div className={styles.focusCard}>
                <span className={styles.focusEmoji} aria-hidden="true">
                  {primaryNextStep.emoji}
                </span>
                <div className={styles.focusContent}>
                  <strong>{primaryNextStep.title}</strong>
                  <span>{primaryNextStep.description}</span>
                </div>
                <button type="button" className={styles.focusButton} onClick={primaryNextStep.onAction}>
                  {primaryNextStep.actionLabel}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.headerCard}>
              <div className={styles.titleBlock}>
                <p className={styles.eyebrow}>Plan dnia</p>
                <h1 className={styles.title}>{formattedDate}</h1>
                <p className={styles.subtitle}>{summaryText}</p>
                {!selectedDayIsToday && (
                  <div className={styles.dayContext}>
                    <span className={styles.contextBadge}>Podgląd innego dnia</span>
                    <button type="button" className={styles.contextButton} onClick={returnToToday}>
                      Wróć do dziś
                    </button>
                  </div>
                )}
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

            <div className={styles.focusCard}>
              <span className={styles.focusEmoji} aria-hidden="true">
                {primaryNextStep.emoji}
              </span>
              <div className={styles.focusContent}>
                <strong>{primaryNextStep.title}</strong>
                <span>{primaryNextStep.description}</span>
              </div>
              <button type="button" className={styles.focusButton} onClick={primaryNextStep.onAction}>
                {primaryNextStep.actionLabel}
              </button>
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

            {showAdultShortcuts && (
              <div className={styles.nextActionsPanel}>
                <div className={styles.nextActionsHeader}>
                  <strong>Przydatne skróty</strong>
                  <span>Dodatkowe miejsca, gdy chcesz zarządzać planem lub sprawdzić wyniki.</span>
                </div>

                <div className={styles.nextActionsGrid}>
                  <Link className={styles.nextActionCard} to="/tasks">
                    <span className={styles.nextActionEmoji} aria-hidden="true">
                      🧩
                    </span>
                    <span className={styles.nextActionText}>
                      <strong>Baza zadań</strong>
                      <span>Porządkuj szablony, edytuj zadania i układaj stały plan domu.</span>
                    </span>
                  </Link>

                  <Link className={styles.nextActionCard} to="/points">
                    <span className={styles.nextActionEmoji} aria-hidden="true">
                      ⭐
                    </span>
                    <span className={styles.nextActionText}>
                      <strong>Punkty i postępy</strong>
                      <span>Sprawdź serię, aktywność i wyniki rodziny bez szukania po ekranach.</span>
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={taskListAnchorRef}>
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

      {!display.kidsMode && (
        <div className={styles.floatingActions}>
          {quickMenuOpen && (
            <div className={styles.quickMenu} role="menu" aria-label="Szybkie akcje">
              <button
                type="button"
                className={styles.quickMenuAction}
                onClick={handleOpenQuickTask}
                role="menuitem"
              >
                <span className={styles.quickMenuEmoji} aria-hidden="true">
                  ⚡
                </span>
                <span className={styles.quickMenuText}>
                  <strong>Szybkie zadanie</strong>
                  <span>Dodaj nowe zadanie od razu.</span>
                </span>
              </button>

              <button
                type="button"
                className={styles.quickMenuAction}
                onClick={handleOpenTaskBase}
                role="menuitem"
              >
                <span className={styles.quickMenuEmoji} aria-hidden="true">
                  🧩
                </span>
                <span className={styles.quickMenuText}>
                  <strong>Baza zadań</strong>
                  <span>Otwórz listę, szablony i edycję.</span>
                </span>
              </button>
            </div>
          )}

          <button
            type="button"
            className={`${styles.fab} ${quickMenuOpen ? styles.fabOpen : ''}`}
            onClick={() => setQuickMenuOpen((current) => !current)}
            aria-label="Otwórz szybkie akcje"
            aria-expanded={quickMenuOpen}
          >
            <span aria-hidden="true">{quickMenuOpen ? '×' : '＋'}</span>
          </button>
        </div>
      )}
    </section>
  );
}

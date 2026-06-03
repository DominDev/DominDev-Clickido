import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isToday } from 'date-fns';
import { DayStrip } from '@components/layout';
import { TaskList } from '@components/task';
import { FocusBanner, KidsHero, KidsRewardStrip } from '@components/ui';
import { calculatePoints } from '@services/taskService';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showSuccessToast, useUIStore } from '@store/uiStore';
import { TASK_TEMPLATES } from '@utils/categories';
import styles from './TodayPage.module.css';

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

  const tasks = getTasksForSelectedDate();
  const progress = getProgressForSelectedDate();
  const points = getPointsForSelectedDate();
  const availablePoints = useTaskStore((state) => state.getAvailablePoints());
  const streak = useTaskStore((state) => state.getCurrentStreak());
  const activeReward = useTaskStore((state) => state.rewards.find(r => r.audience !== 'adult'));
  const selectedDayIsToday = isToday(selectedDate);

  useEffect(() => {
    if (display.kidsMode && !selectedDayIsToday) {
      setSelectedDate(new Date());
    }
  }, [display.kidsMode, selectedDayIsToday, setSelectedDate]);

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

  return (
    <section className={`${styles.page} ${display.kidsMode ? styles.kidsPage : ''}`}>
      {!display.kidsMode && <DayStrip />}

      <div className={styles.content}>
        {display.kidsMode ? (
          <>
            <KidsHero
              done={progress.completed}
              total={progress.total}
              points={points}
            />

            {activeReward && (
              <KidsRewardStrip
                title={activeReward.title}
                emoji={activeReward.emoji}
                currentPoints={availablePoints}
                targetPoints={activeReward.target}
              />
            )}
          </>
        ) : (
          <>
            <FocusBanner
              done={progress.completed}
              total={progress.total}
              points={points}
              streak={streak}
            />

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

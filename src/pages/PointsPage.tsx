import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { KidsStarIcon, PointsTile } from '@components/ui';
import { CategoryId } from '@/types';
import { getCategoryLabel } from '@utils/categories';
import { getLocalDateKey } from '@utils/date';
import { formatPoints } from '@utils/formatting';
import styles from './PointsPage.module.css';

type RewardMilestone = {
  target: number;
  emoji: string;
  title: string;
  hint: string;
};

const REWARD_MILESTONES: RewardMilestone[] = [
  { target: 50, emoji: '🍿', title: 'Mała nagroda', hint: 'Krótka przyjemność po dobrym starcie.' },
  { target: 100, emoji: '🎨', title: 'Poziom 2', hint: 'Czas na większy wybór i więcej zabawy.' },
  { target: 180, emoji: '🎮', title: 'Super misja', hint: 'Nagroda za regularne zbieranie punktów.' },
  { target: 260, emoji: '🍕', title: 'Nagroda rodzinna', hint: 'Cel, który naprawdę czuć i widać.' },
];

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function formatShortDate(dateString: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateString));
}

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

export default function PointsPage() {
  const { completions, tasks, selectedDate, getPointsForSelectedDate, getProgressForSelectedDate } = useTaskStore();
  const { display } = useSettingsStore();
  const todayPoints = getPointsForSelectedDate();
  const progress = getProgressForSelectedDate();
  const pendingTasks = Math.max(progress.total - progress.completed, 0);

  const kidsMood = useMemo(
    () => getKidsMood(progress.percentage, pendingTasks),
    [progress.percentage, pendingTasks]
  );

  const stats = useMemo(() => {
    const totalPoints = completions.reduce((sum, completion) => sum + completion.points, 0);
    const uniqueDates = [...new Set(completions.map((completion) => completion.date))].sort();
    const activeDays = uniqueDates.length;
    const firstDay = uniqueDates[0] ?? null;

    let bestStreak = 0;
    let runningStreak = 0;
    let previousDate: Date | null = null;

    uniqueDates.forEach((dateString) => {
      const currentDate = new Date(`${dateString}T00:00:00`);

      if (!previousDate) {
        runningStreak = 1;
      } else {
        const diffDays = Math.round(
          (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        runningStreak = diffDays === 1 ? runningStreak + 1 : 1;
      }

      bestStreak = Math.max(bestStreak, runningStreak);
      previousDate = currentDate;
    });

    const todayDateString = getLocalDateKey(selectedDate);
    const completedDates = new Set(uniqueDates);
    let currentStreak = 0;
    const probeDate = new Date(`${todayDateString}T00:00:00`);

    while (completedDates.has(getLocalDateKey(probeDate))) {
      currentStreak += 1;
      probeDate.setDate(probeDate.getDate() - 1);
    }

    const weekStart = startOfWeek(selectedDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekPoints = completions
      .filter((completion) => {
        const completionDate = new Date(`${completion.date}T00:00:00`);
        return completionDate >= weekStart && completionDate <= weekEnd;
      })
      .reduce((sum, completion) => sum + completion.points, 0);

    const taskLookup = new Map(tasks.map((task) => [task.id, task]));
    const categoryTotals = completions.reduce<Record<string, number>>((acc, completion) => {
      const task = taskLookup.get(completion.taskId);
      if (!task) return acc;
      acc[task.category] = (acc[task.category] ?? 0) + 1;
      return acc;
    }, {});

    const favoriteCategory =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const recentDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() - (6 - index));
      const dateString = getLocalDateKey(date);
      const points = completions
        .filter((completion) => completion.date === dateString)
        .reduce((sum, completion) => sum + completion.points, 0);

      return {
        dateString,
        label: new Intl.DateTimeFormat('pl-PL', { weekday: 'short' }).format(date),
        points,
      };
    });

    const maxRecentPoints = Math.max(...recentDays.map((day) => day.points), 1);
    const level = Math.max(1, Math.floor(totalPoints / 100) + 1);
    const nextLevelTarget = level * 100;
    const previousLevelTarget = Math.max(0, (level - 1) * 100);
    const pointsIntoLevel = totalPoints - previousLevelTarget;
    const levelSpan = Math.max(1, nextLevelTarget - previousLevelTarget);
    const levelProgress = Math.min(100, Math.round((pointsIntoLevel / levelSpan) * 100));
    const pointsToNextLevel = Math.max(0, nextLevelTarget - totalPoints);
    const unlockedRewards = REWARD_MILESTONES.filter((reward) => totalPoints >= reward.target).length;
    const nextReward = REWARD_MILESTONES.find((reward) => totalPoints < reward.target) ?? null;

    return {
      totalPoints,
      activeDays,
      firstDay,
      weekPoints,
      currentStreak,
      bestStreak,
      favoriteCategory,
      totalCompleted: completions.length,
      recentDays,
      maxRecentPoints,
      level,
      nextLevelTarget,
      previousLevelTarget,
      levelProgress,
      pointsToNextLevel,
      unlockedRewards,
      nextReward,
    };
  }, [completions, selectedDate, tasks]);

  const primaryNextStep = useMemo(() => {
    if (display.kidsMode) {
      if (stats.nextReward) {
        return {
          emoji: '🚀',
          title: 'Najlepiej teraz wrócić do zadań',
          description: `Do celu "${stats.nextReward.title}" brakuje jeszcze ${stats.nextReward.target - stats.totalPoints} punktów.`,
          actionLabel: 'Wróć do dzisiaj',
          to: '/today',
        };
      }

      return {
        emoji: '🌟',
        title: 'Wszystkie obecne nagrody są odblokowane',
        description: 'Możesz dalej zbierać punkty albo poczekać, aż rodzic doda nowe zadania.',
        actionLabel: 'Wróć do dzisiaj',
        to: '/today',
      };
    }

    if (stats.totalCompleted === 0) {
      return {
        emoji: '➕',
        title: 'Najpierw przygotuj pierwsze zadania',
        description: 'Bez zadań statystyki nie będą jeszcze nic mówiły. Najlepszy kolejny krok to zbudować bazę dnia.',
        actionLabel: 'Otwórz bazę zadań',
        to: '/tasks',
      };
    }

    return {
      emoji: '📋',
      title: 'Po statystykach najlepiej wrócić do planu dnia',
      description: 'Wyniki mają sens wtedy, gdy od razu przekładają się na kolejne wykonane zadania.',
      actionLabel: 'Wróć do dnia',
      to: '/today',
    };
  }, [display.kidsMode, stats.nextReward, stats.totalCompleted, stats.totalPoints]);

  const hasStatsData = stats.totalCompleted > 0;

  return (
    <section className={`${styles.page} ${display.kidsMode ? styles.kidsPage : ''}`}>
      {display.kidsMode ? (
        <div className={styles.kidsTopRow}>
          <div className={styles.headerCard}>
            <div className={styles.titleBlock}>
              <p className={styles.eyebrow}>Sklepik</p>
              <h1 className={styles.kidsTitle}>Moje skarby</h1>
              <p className={styles.kidsSubtitle}>Wybierz nagrodę za swoje gwiazdki!</p>
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
            label="Moje skarby"
            value={stats.totalPoints} 
            subLabel="Zebrane dzisiaj"
            subValue={todayPoints}
          />
        </div>
      ) : (
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Twoje postępy</p>
            <h1 className={styles.title}>Punkty</h1>
            <p className={styles.subtitle}>
              Jedno miejsce do szybkiego sprawdzenia wyniku, serii i tempa całego domu.
            </p>
          </div>

          <div className={styles.heroCard}>
            <span className={styles.heroLabel}>Dzisiaj</span>
            <strong className={styles.heroValue}>
              {formatPoints(todayPoints)}
            </strong>
            <span className={styles.heroHint}>
              Łącznie {formatPoints(stats.totalPoints)} · {stats.currentStreak} dni serii
            </span>
          </div>
        </header>
      )}

      {!display.kidsMode && (
        <section className={styles.focusCard} aria-label="Najważniejszy następny krok">
          <span className={styles.focusEmoji} aria-hidden="true">
            {primaryNextStep.emoji}
          </span>
          <div className={styles.focusContent}>
            <strong>{primaryNextStep.title}</strong>
            <span>{primaryNextStep.description}</span>
          </div>
          <Link className={styles.focusLink} to={primaryNextStep.to}>
            {primaryNextStep.actionLabel}
          </Link>
        </section>
      )}

      {!hasStatsData && (
        <section className={`${styles.emptyStatePanel} ${display.kidsMode ? styles.kidsEmptyState : ''}`} aria-label="Brak danych punktowych">
          <div className={styles.emptyStateHeader}>
            <span className={styles.emptyStateEmoji} aria-hidden="true">
              {display.kidsMode ? '🎁' : '📊'}
            </span>
            <div className={styles.emptyStateText}>
              <h2>
                {display.kidsMode
                  ? 'Nagrody pojawią się tutaj!'
                  : 'Statystyki pojawią się po pierwszych zadaniach'}
              </h2>
              <p>
                {display.kidsMode
                  ? 'Kiedy zrobisz pierwsze zadania z listy „Dziś”, zaczniesz zbierać gwiazdki na wspaniałe nagrody.'
                  : 'Na razie ten ekran jest pusty, bo nie ma jeszcze wykonanych zadań. Wróć do dnia albo przygotuj pierwszą bazę zadań.'}
              </p>
            </div>
          </div>
          {display.kidsMode && (
            <Link className={styles.emptyStateAction} to="/today">
              Wróć do zadań
            </Link>
          )}
        </section>
      )}

      {display.kidsMode && hasStatsData && (
        <section className={styles.milestonesPanel} aria-label="Nagrody do kupienia">
          <div className={styles.milestoneGrid}>
            {REWARD_MILESTONES.map((reward) => {
              const unlocked = stats.totalPoints >= reward.target;
              const missingPoints = Math.max(0, reward.target - stats.totalPoints);
              const progressPercent = Math.min(
                100,
                Math.max(8, Math.round((stats.totalPoints / reward.target) * 100))
              );

              return (
                <article
                  key={reward.target}
                  className={`${styles.milestoneCard} ${unlocked ? styles.unlocked : ''}`}
                >
                  <div className={styles.milestoneCardContent}>
                    <div className={styles.milestoneEmojiWrap}>
                      <span className={styles.milestoneEmoji} aria-hidden="true">
                        {reward.emoji}
                      </span>
                    </div>
                    <div className={styles.milestoneTextContent}>
                      <strong>{reward.title}</strong>
                      <span>{reward.hint}</span>
                    </div>
                  </div>

                  {!unlocked && (
                    <div className={styles.kidsMiniProgress} aria-hidden="true">
                      <div className={styles.kidsMiniProgressTrack}>
                        <div
                          className={styles.kidsMiniProgressFill}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className={styles.milestoneFooter}>
                    <span className={styles.milestoneTarget}>
                      <KidsStarIcon className={styles.smallStarIcon} /> {reward.target}
                    </span>
                    {unlocked ? (
                      <span className={styles.rewardClaim}>Odbierz!</span>
                    ) : (
                      <span className={styles.rewardMissing}>Brakuje {missingPoints}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!display.kidsMode && hasStatsData && (
        <section className={styles.parentActionPanel} aria-label="Co dalej po statystykach">
          <div className={styles.panelHeader}>
            <h2>Co dalej?</h2>
            <span>Po sprawdzeniu wyników zwykle wykonuje się jedną z tych akcji.</span>
          </div>

          <div className={styles.parentActionGrid}>
            <Link className={styles.parentActionCard} to="/today">
              <span className={styles.parentActionEmoji} aria-hidden="true">
                📋
              </span>
              <span className={styles.parentActionText}>
                <strong>Wróć do dnia</strong>
                <span>Sprawdź bieżący plan i odklikane zadania.</span>
              </span>
            </Link>

            <Link className={styles.parentActionCard} to="/tasks">
              <span className={styles.parentActionEmoji} aria-hidden="true">
                🧩
              </span>
              <span className={styles.parentActionText}>
                <strong>Ułóż bazę zadań</strong>
                <span>Dodaj nowe obowiązki albo popraw obecną strukturę.</span>
              </span>
            </Link>
          </div>
        </section>
      )}

      {hasStatsData && !display.kidsMode && (
        <section className={styles.cardsGrid} aria-label="Podsumowanie punktów">
          <article className={styles.statCard}>
            <span className={styles.cardLabel}>Łącznie</span>
            <strong className={styles.cardValue}>{formatPoints(stats.totalPoints)}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.cardLabel}>Ten tydzień</span>
            <strong className={styles.cardValue}>{formatPoints(stats.weekPoints)}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.cardLabel}>Zrobione zadania</span>
            <strong className={styles.cardValue}>{stats.totalCompleted}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.cardLabel}>Aktywne dni</span>
            <strong className={styles.cardValue}>{stats.activeDays}</strong>
          </article>
        </section>
      )}

      {hasStatsData && !display.kidsMode && (
        <section className={styles.detailsGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Najważniejsze trendy</h2>
              <span>Seria, regularność i najczęstsza kategoria</span>
            </div>

            <dl className={styles.detailList}>
              <div>
                <dt>Aktualny streak</dt>
                <dd>{stats.currentStreak} dni</dd>
              </div>
              <div>
                <dt>Najlepszy streak</dt>
                <dd>{stats.bestStreak} dni</dd>
              </div>
              <div>
                <dt>Pierwsza aktywność</dt>
                <dd>{stats.firstDay ? formatShortDate(stats.firstDay) : 'Jeszcze brak danych'}</dd>
              </div>
              <div>
                <dt>Najczęstsza kategoria</dt>
                <dd>
                  {stats.favoriteCategory
                    ? getCategoryLabel(stats.favoriteCategory as CategoryId)
                    : 'Brak danych'}
                </dd>
              </div>
            </dl>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Ostatnie 7 dni</h2>
              <span>Szybki podgląd tygodnia</span>
            </div>

            <div className={styles.chart}>
              {stats.recentDays.map((day) => (
                <div key={day.dateString} className={styles.barItem}>
                  <div className={styles.barTrack} aria-hidden="true">
                    <div
                      className={styles.barFill}
                      style={{ height: `${(day.points / stats.maxRecentPoints) * 100}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>{day.points}</span>
                  <span className={styles.barLabel}>{day.label}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </section>
  );
}

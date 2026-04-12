import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showInfoToast } from '@store/uiStore';
import { CategoryId } from '@/types';
import { getCategoryLabel } from '@utils/categories';
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

export default function PointsPage() {
  const { completions, tasks, selectedDate, getPointsForSelectedDate } = useTaskStore();
  const { display } = useSettingsStore();
  const todayPoints = getPointsForSelectedDate();

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

    const todayDateString = selectedDate.toISOString().split('T')[0];
    const completedDates = new Set(uniqueDates);
    let currentStreak = 0;
    const probeDate = new Date(`${todayDateString}T00:00:00`);

    while (completedDates.has(probeDate.toISOString().split('T')[0])) {
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
      const dateString = date.toISOString().split('T')[0];
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

  return (
    <section className={`${styles.page} ${display.kidsMode ? styles.kidsPage : ''}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            {display.kidsMode ? 'Tablica nagród' : 'Twoje postępy'}
          </p>
          <h1 className={styles.title}>
            {display.kidsMode ? 'Moje punkty' : 'Punkty i statystyki'}
          </h1>
          <p className={styles.subtitle}>
            {display.kidsMode
              ? 'Tutaj widać, ile udało się już zdobyć. Każde zrobione zadanie daje kolejne gwiazdki i przybliża do następnego celu.'
              : 'Najważniejsze liczby w jednym miejscu: punkty, aktywność, serie i postęp tygodnia.'}
          </p>
        </div>

        <div className={`${styles.heroCard} ${display.kidsMode ? styles.kidsHeroCard : ''}`}>
          <span className={styles.heroLabel}>
            {display.kidsMode ? '⭐ Dzisiejszy wynik' : 'Dzisiaj'}
          </span>
          <strong className={styles.heroValue}>{formatPoints(todayPoints)}</strong>
          {display.kidsMode ? (
            <>
              <span className={styles.heroHint}>
                Poziom {stats.level} · do kolejnego brakuje {stats.pointsToNextLevel} pkt
              </span>
              <div className={styles.levelTrack} aria-hidden="true">
                <div className={styles.levelFill} style={{ width: `${stats.levelProgress}%` }} />
              </div>
            </>
          ) : (
            <span className={styles.heroHint}>
              Łącznie {formatPoints(stats.totalPoints)} · {stats.currentStreak} dni serii
            </span>
          )}
        </div>
      </header>

      {display.kidsMode && (
        <>
          <section className={styles.kidsRewards} aria-label="Postęp nagród">
            <article className={styles.rewardCard}>
              <span className={styles.rewardEmoji} aria-hidden="true">
                🏅
              </span>
              <strong>Poziom {stats.level}</strong>
              <span>Łącznie zdobyto {stats.totalPoints} punktów.</span>
            </article>

            <article className={styles.rewardCard}>
              <span className={styles.rewardEmoji} aria-hidden="true">
                🚀
              </span>
              <strong>Następny cel</strong>
              <span>
                {stats.nextReward
                  ? `${stats.nextReward.title} za ${stats.nextReward.target} pkt`
                  : 'Wszystkie obecne cele są już odblokowane.'}
              </span>
            </article>
          </section>

          <section className={styles.milestonesPanel} aria-label="Kamienie milowe">
            <div className={styles.panelHeader}>
              <h2>Ścieżka nagród</h2>
              <span>{stats.unlockedRewards}/{REWARD_MILESTONES.length} odblokowane</span>
            </div>

            <div className={styles.milestoneGrid}>
              {REWARD_MILESTONES.map((reward) => {
                const unlocked = stats.totalPoints >= reward.target;
                const isNext = !unlocked && stats.nextReward?.target === reward.target;

                return (
                  <article
                    key={reward.target}
                    className={`${styles.milestoneCard} ${unlocked ? styles.unlocked : ''} ${
                      isNext ? styles.nextMilestone : ''
                    }`}
                  >
                    <span className={styles.milestoneEmoji} aria-hidden="true">
                      {reward.emoji}
                    </span>
                    <strong>{reward.title}</strong>
                    <span>{reward.hint}</span>
                    <div className={styles.milestoneFooter}>
                      <span>{reward.target} pkt</span>
                      <span>{unlocked ? 'Odblokowane' : isNext ? 'Następne' : 'Przed Tobą'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.kidsActionPanel} aria-label="Co dalej">
            <div className={styles.panelHeader}>
              <h2>Co dalej?</h2>
              <span>Najlepiej zdobywa się punkty, gdy od razu wracasz do zadań.</span>
            </div>

            <div className={styles.kidsActionGrid}>
              <Link className={styles.kidsActionCard} to="/today">
                <span className={styles.kidsActionEmoji} aria-hidden="true">
                  🧸
                </span>
                <span className={styles.kidsActionText}>
                  <strong>Wróć do dzisiaj</strong>
                  <span>Zobacz duże kafelki z zadaniami na teraz.</span>
                </span>
              </Link>

              <button
                type="button"
                className={styles.kidsActionCard}
                onClick={() =>
                  showInfoToast('Nowe zadania może dodać rodzic z trybu dla dorosłych.', 4500)
                }
              >
                <span className={styles.kidsActionEmoji} aria-hidden="true">
                  🧩
                </span>
                <span className={styles.kidsActionText}>
                  <strong>Poproś o nowe zadania</strong>
                  <span>Rodzic może dodać kolejne misje i nowe obrazki.</span>
                </span>
              </button>
            </div>
          </section>
        </>
      )}

      {!display.kidsMode && (
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

            <Link className={styles.parentActionCard} to="/settings">
              <span className={styles.parentActionEmoji} aria-hidden="true">
                ⚙️
              </span>
              <span className={styles.parentActionText}>
                <strong>Dopasuj ustawienia</strong>
                <span>Zmień wygląd, kids mode i zachowanie ekranu.</span>
              </span>
            </Link>
          </div>
        </section>
      )}

      <section className={styles.cardsGrid} aria-label="Podsumowanie punktów">
        <article className={styles.statCard}>
          <span className={styles.cardLabel}>{display.kidsMode ? '🏆 Łącznie' : 'Łącznie'}</span>
          <strong className={styles.cardValue}>{formatPoints(stats.totalPoints)}</strong>
        </article>
        <article className={styles.statCard}>
          <span className={styles.cardLabel}>{display.kidsMode ? '🚀 Ten tydzień' : 'Ten tydzień'}</span>
          <strong className={styles.cardValue}>{formatPoints(stats.weekPoints)}</strong>
        </article>
        <article className={styles.statCard}>
          <span className={styles.cardLabel}>{display.kidsMode ? '✅ Zadania' : 'Zrobione zadania'}</span>
          <strong className={styles.cardValue}>{stats.totalCompleted}</strong>
        </article>
        <article className={styles.statCard}>
          <span className={styles.cardLabel}>{display.kidsMode ? '🔥 Dni aktywne' : 'Aktywne dni'}</span>
          <strong className={styles.cardValue}>{stats.activeDays}</strong>
        </article>
      </section>

      <section className={styles.detailsGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{display.kidsMode ? 'Twoje rekordy' : 'Streak i rytm'}</h2>
            {!display.kidsMode && <span>Najlepsza regularność i ulubione nawyki</span>}
          </div>

          <dl className={styles.detailList}>
            <div>
              <dt>{display.kidsMode ? '🔥 Seria teraz' : 'Aktualny streak'}</dt>
              <dd>{stats.currentStreak} dni</dd>
            </div>
            <div>
              <dt>{display.kidsMode ? '🌈 Najlepsza seria' : 'Najlepszy streak'}</dt>
              <dd>{stats.bestStreak} dni</dd>
            </div>
            <div>
              <dt>{display.kidsMode ? '📅 Start przygody' : 'Pierwsza aktywność'}</dt>
              <dd>{stats.firstDay ? formatShortDate(stats.firstDay) : 'Jeszcze brak danych'}</dd>
            </div>
            <div>
              <dt>{display.kidsMode ? '🎯 Najczęściej' : 'Najczęstsza kategoria'}</dt>
              <dd>
                {stats.favoriteCategory ? getCategoryLabel(stats.favoriteCategory as CategoryId) : 'Brak danych'}
              </dd>
            </div>
          </dl>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{display.kidsMode ? 'Punkty z ostatnich dni' : 'Ostatnie 7 dni'}</h2>
            <span>{display.kidsMode ? 'Każdy słupek to dzień pracy' : 'Szybki podgląd tygodnia'}</span>
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
                <span className={styles.barValue}>
                  {display.kidsMode ? `⭐ ${day.points}` : day.points}
                </span>
                <span className={styles.barLabel}>{day.label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}

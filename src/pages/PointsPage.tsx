import { useMemo } from 'react';
import { useTaskStore } from '@store/taskStore';
import { formatPoints } from '@utils/formatting';
import styles from './PointsPage.module.css';

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
    };
  }, [completions, selectedDate, tasks]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Twoje postępy</p>
          <h1 className={styles.title}>Punkty i statystyki</h1>
          <p className={styles.subtitle}>
            Prosty ekran MVP z najważniejszymi danymi dla całej rodziny.
          </p>
        </div>
        <div className={styles.heroCard}>
          <span className={styles.heroLabel}>Dzisiaj</span>
          <strong className={styles.heroValue}>{formatPoints(todayPoints)}</strong>
        </div>
      </header>

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

      <section className={styles.detailsGrid}>
        <article className={styles.panel}>
          <h2>Streak i rytm</h2>
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
              <dd>{stats.favoriteCategory ?? 'Brak danych'}</dd>
            </div>
          </dl>
        </article>

        <article className={styles.panel}>
          <h2>Ostatnie 7 dni</h2>
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
    </section>
  );
}

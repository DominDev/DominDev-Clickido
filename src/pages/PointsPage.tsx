import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '@store/settingsStore';
import { useTaskStore } from '@store/taskStore';
import { showErrorToast, showSuccessToast, showUndoToast, useUIStore } from '@store/uiStore';
import {
  KidsStarIcon,
  PointsTile,
  PinModal,
  RewardClaimModal,
  RewardModal,
} from '@components/ui';
import { CategoryId, CustomReward, RewardAudience, RewardClaim } from '@/types';
import { getCategoryLabel } from '@utils/categories';
import { getLocalDateKey } from '@utils/date';
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

function formatClaimTimestamp(dateString: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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

const AUDIENCE_META: Record<RewardAudience, { label: string; className: string }> = {
  family: { label: 'Dla wszystkich', className: styles.metaBadgeFamily },
  child: { label: 'Tylko dziecko', className: styles.metaBadgeChild },
  adult: { label: 'Tylko dorosły', className: styles.metaBadgeAdult },
};

const CLAIM_SOURCE_LABEL: Record<RewardClaim['source'], string> = {
  kids: 'Kids Mode',
  parent: 'Panel rodzica',
};

export default function PointsPage() {
  const {
    completions,
    tasks,
    selectedDate,
    getPointsForSelectedDate,
    getProgressForSelectedDate,
    rewardClaims,
    claimReward,
    revertRewardClaim,
    unclaimReward,
    getAvailablePoints,
    getTotalEarnedPoints,
    getTotalSpentPoints,
    rewards,
    addReward,
    updateReward,
    deleteReward,
  } = useTaskStore();
  const { display } = useSettingsStore();
  const todayPoints = getPointsForSelectedDate();
  const progress = getProgressForSelectedDate();
  const pendingTasks = Math.max(progress.total - progress.completed, 0);
  const availablePoints = getAvailablePoints();
  const totalEarnedPoints = getTotalEarnedPoints();
  const totalSpentPoints = getTotalSpentPoints();

  const { modal, closeModal } = useUIStore();
  const [invalidRewardId, setInvalidRewardId] = useState<string | null>(null);
  const [unclaimRewardId, setUnclaimRewardId] = useState<string | null>(null);
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<CustomReward | null>(null);
  const [initialAudience, setInitialAudience] = useState<RewardAudience>('family');

  useEffect(() => {
    if (modal.isOpen && modal.type === 'rewardForm') {
      setEditingReward(null);
      const modalData = modal.data as { audience?: RewardAudience } | undefined;
      setInitialAudience(modalData?.audience ?? 'family');
      setIsRewardModalOpen(true);
      closeModal();
    }
  }, [modal.isOpen, modal.type, modal.data, closeModal]);

  const visibleRewards = useMemo(() => {
    if (display.kidsMode) {
      return rewards.filter((reward) => reward.audience === 'child' || reward.audience === 'family');
    }

    return rewards;
  }, [rewards, display.kidsMode]);

  const activeRewardClaims = useMemo(
    () => rewardClaims.filter((claim) => claim.status === 'active'),
    [rewardClaims]
  );

  const claimedRewardIds = useMemo(
    () => new Set(activeRewardClaims.map((claim) => claim.rewardId)),
    [activeRewardClaims]
  );

  const isRewardClaimed = (rewardId: string) => claimedRewardIds.has(rewardId);

  const handleMilestoneClick = (unlocked: boolean, claimed: boolean, rewardId: string) => {
    if (claimed) {
      if (!display.kidsModePin) {
        unclaimReward(rewardId);
      } else {
        setUnclaimRewardId(rewardId);
      }
      return;
    }

    if (!unlocked) {
      setInvalidRewardId(rewardId);
      setTimeout(() => setInvalidRewardId(null), 400);
      return;
    }

    claimReward(rewardId, 'kids');
  };

  const handleUnclaimWithPin = (pin: string): boolean => {
    if (pin === display.kidsModePin) {
      if (unclaimRewardId !== null) {
        unclaimReward(unclaimRewardId);
        setUnclaimRewardId(null);
      }
      return true;
    }

    return false;
  };

  const handleSaveReward = (data: Omit<CustomReward, 'id' | 'createdAt'>) => {
    if (editingReward) {
      updateReward(editingReward.id, data);
    } else {
      addReward(data);
    }

    setEditingReward(null);
  };

  const handleEditReward = (reward: CustomReward) => {
    setEditingReward(reward);
    setIsRewardModalOpen(true);
  };

  const handleConfirmParentClaim = () => {
    if (!claimingRewardId) {
      return;
    }

    const claim = claimReward(claimingRewardId, 'parent');

    if (claim) {
      showUndoToast(`Odebrano nagrodę „${claim.rewardTitle}”.`, () => {
        revertRewardClaim(claim.id);
      });
    }

    setClaimingRewardId(null);
  };

  const handleRevertClaim = (claim: RewardClaim) => {
    const reverted = revertRewardClaim(claim.id);

    if (reverted) {
      showSuccessToast(`Przywrócono ${formatPoints(claim.pointsSpent)} do salda.`);
    }
  };

  const kidsMood = useMemo(
    () => getKidsMood(progress.percentage, pendingTasks),
    [progress.percentage, pendingTasks]
  );

  const stats = useMemo(() => {
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
    const level = Math.max(1, Math.floor(totalEarnedPoints / 100) + 1);
    const nextLevelTarget = level * 100;
    const previousLevelTarget = Math.max(0, (level - 1) * 100);
    const pointsIntoLevel = totalEarnedPoints - previousLevelTarget;
    const levelSpan = Math.max(1, nextLevelTarget - previousLevelTarget);
    const levelProgress = Math.min(100, Math.round((pointsIntoLevel / levelSpan) * 100));
    const pointsToNextLevel = Math.max(0, nextLevelTarget - totalEarnedPoints);
    const unlockedRewards = visibleRewards.filter(
      (reward) => availablePoints >= reward.target && !isRewardClaimed(reward.id)
    ).length;
    const nextReward =
      [...visibleRewards]
        .sort((a, b) => a.target - b.target)
        .find((reward) => !isRewardClaimed(reward.id) && availablePoints < reward.target) ?? null;

    return {
      totalPoints: totalEarnedPoints,
      availablePoints,
      totalSpentPoints,
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
  }, [
    completions,
    selectedDate,
    tasks,
    availablePoints,
    totalEarnedPoints,
    totalSpentPoints,
    visibleRewards,
    claimedRewardIds,
  ]);

  const parentRewardShelf = useMemo(() => {
    return [...visibleRewards]
      .filter((reward) => !isRewardClaimed(reward.id))
      .sort((a, b) => {
        const aUnlocked = availablePoints >= a.target;
        const bUnlocked = availablePoints >= b.target;

        if (aUnlocked !== bUnlocked) {
          return aUnlocked ? -1 : 1;
        }

        const aMissing = Math.max(0, a.target - availablePoints);
        const bMissing = Math.max(0, b.target - availablePoints);

        return aMissing - bMissing || a.target - b.target;
      });
  }, [visibleRewards, availablePoints, claimedRewardIds]);

  const historyItems = useMemo(() => rewardClaims, [rewardClaims]);

  const parentClaimingReward =
    rewards.find((reward) => reward.id === claimingRewardId) ?? null;

  const hasStatsData = stats.totalCompleted > 0;

  return (
    <section className={`${styles.page} ${display.kidsMode ? styles.kidsPage : ''}`}>
      {display.kidsMode ? (
        <div className={styles.kidsTopRow}>
          <div className={styles.headerCard}>
            <div className={styles.titleBlock}>
              <p className={styles.eyebrow}>Sklep</p>
              <h1 className={styles.kidsTitle}>Nagrody</h1>
              {stats.nextReward ? (
                <div className={styles.kidsMiniProgress}>
                  <div className={styles.kidsMiniProgressTrack} aria-hidden="true">
                    <div
                      className={styles.kidsMiniProgressFill}
                      style={{
                        width: `${Math.max(
                          8,
                          Math.round((stats.availablePoints / stats.nextReward.target) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className={styles.kidsMiniProgressLabel}>
                    Do "{stats.nextReward.title}" brakuje{' '}
                    {stats.nextReward.target - stats.availablePoints} gwiazdek
                  </p>
                </div>
              ) : (
                <p className={styles.kidsSubtitle}>Wszystkie nagrody zdobyte!</p>
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
            label="Moje skarby"
            value={stats.availablePoints}
            subLabel="Zebrane dzisiaj"
            subValue={todayPoints}
          />
        </div>
      ) : (
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Punkty i nagrody</p>
            <h1 className={styles.title}>Saldo i odbiór nagród</h1>
            <p className={styles.subtitle}>
              Jedno miejsce do kontroli dostępnych punktów, odebrań i historii nagród.
            </p>
          </div>

          <div className={styles.heroCard}>
            <span className={styles.heroLabel}>Dostępne teraz</span>
            <strong className={styles.heroValue}>{formatPoints(availablePoints)}</strong>
            <span className={styles.heroHint}>
              Zebrane {formatPoints(totalEarnedPoints)} · wydane {formatPoints(totalSpentPoints)}
            </span>
          </div>
        </header>
      )}

      {!display.kidsMode && (
        <section className={styles.cardsGrid} aria-label="Saldo punktów">
          <article className={styles.statCard}>
            <span className={styles.cardLabel}>Dzisiaj</span>
            <strong className={styles.cardValue}>{formatPoints(todayPoints)}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.cardLabel}>Zebrane łącznie</span>
            <strong className={styles.cardValue}>{formatPoints(totalEarnedPoints)}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.cardLabel}>Wydane</span>
            <strong className={styles.cardValue}>{formatPoints(totalSpentPoints)}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.cardLabel}>Dostępne</span>
            <strong className={styles.cardValue}>{formatPoints(availablePoints)}</strong>
          </article>
        </section>
      )}

      {display.kidsMode && !hasStatsData && (
        <section
          className={`${styles.emptyStatePanel} ${styles.kidsEmptyState}`}
          aria-label="Brak danych punktowych"
        >
          <div className={styles.emptyStateHeader}>
            <span className={styles.emptyStateEmoji} aria-hidden="true">
              🎁
            </span>
            <div className={styles.emptyStateText}>
              <h2>Nagrody pojawią się tutaj!</h2>
              <p>
                Kiedy zrobisz pierwsze zadania z listy „Dziś", zaczniesz zbierać gwiazdki na
                wspaniałe nagrody.
              </p>
            </div>
          </div>
          <Link className={styles.emptyStateAction} to="/today">
            Wróć do zadań
          </Link>
        </section>
      )}

      {display.kidsMode && hasStatsData && (
        <section className={styles.milestonesPanel} aria-label="Nagrody do kupienia">
          <div className={styles.milestoneGrid}>
            {[...visibleRewards]
              .sort((a, b) => {
                const aClaimed = isRewardClaimed(a.id);
                const bClaimed = isRewardClaimed(b.id);
                if (aClaimed && !bClaimed) return 1;
                if (!aClaimed && bClaimed) return -1;
                return a.target - b.target;
              })
              .map((reward) => {
                const claimed = isRewardClaimed(reward.id);
                const unlocked = stats.availablePoints >= reward.target && !claimed;
                const missingPoints = Math.max(0, reward.target - stats.availablePoints);
                const progressPercent = Math.min(
                  100,
                  Math.max(8, Math.round((stats.availablePoints / reward.target) * 100))
                );

                return (
                  <article
                    key={reward.id}
                    data-claimed-stamp="ODEBRANE!"
                    className={`${styles.milestoneCard} ${unlocked ? styles.unlocked : ''} ${
                      claimed ? styles.claimed : ''
                    } ${!unlocked && !claimed && invalidRewardId === reward.id ? styles.invalidShake : ''}`}
                    onClick={() => handleMilestoneClick(unlocked, claimed, reward.id)}
                  >
                    <div className={styles.milestoneCardContent}>
                      <div className={styles.milestoneEmojiWrap}>
                        <span className={styles.milestoneEmoji} aria-hidden="true">
                          {reward.emoji}
                        </span>
                      </div>
                      <div className={styles.milestoneTextContent}>
                        <strong>{reward.title}</strong>
                        <span>{reward.hint ?? ''}</span>
                      </div>
                    </div>

                    {!unlocked && !claimed && (
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
                      {!claimed &&
                        (unlocked ? (
                          <span className={styles.rewardClaim}>Odbierz!</span>
                        ) : (
                          <span className={styles.rewardMissing}>Brakuje {missingPoints}</span>
                        ))}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      )}

      {!display.kidsMode && (
        <section className={styles.parentRewardsPanel} aria-label="Nagrody do odbioru">
          <div className={styles.panelHeader}>
            <h2>Do odebrania teraz</h2>
            <span>
              Najpierw widać nagrody dostępne od razu, potem cele najbliższe odblokowania.
            </span>
          </div>

          {parentRewardShelf.length > 0 ? (
            <div className={styles.parentRewardsGrid}>
              {parentRewardShelf.map((reward) => {
                const unlocked = availablePoints >= reward.target;
                const missingPoints = Math.max(0, reward.target - availablePoints);
                const progressPercent = Math.min(
                  100,
                  Math.max(8, Math.round((availablePoints / reward.target) * 100))
                );

                return (
                  <article
                    key={reward.id}
                    className={`${styles.parentRewardCard} ${
                      unlocked ? styles.parentRewardCardAvailable : ''
                    }`}
                  >
                    <div className={styles.parentRewardHeader}>
                      <span className={styles.parentRewardEmoji} aria-hidden="true">
                        {reward.emoji}
                      </span>
                      <div className={styles.parentRewardText}>
                        <strong>{reward.title}</strong>
                        <span>{reward.hint ?? 'Nagroda gotowa do odebrania po uzbieraniu punktów.'}</span>
                      </div>
                    </div>

                    <div className={styles.parentRewardMeta}>
                      <span
                        className={`${styles.metaBadge} ${AUDIENCE_META[reward.audience].className}`}
                      >
                        {AUDIENCE_META[reward.audience].label}
                      </span>
                      <span className={styles.rewardCostBadge}>{formatPoints(reward.target)}</span>
                    </div>

                    <div className={styles.parentRewardProgress}>
                      <div className={styles.parentRewardProgressTrack} aria-hidden="true">
                        <div
                          className={styles.parentRewardProgressFill}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className={styles.parentRewardProgressLabel}>
                        {unlocked
                          ? 'Dostępna teraz'
                          : `Brakuje jeszcze ${formatPoints(missingPoints)}`}
                      </span>
                    </div>

                    <div className={styles.parentRewardActions}>
                      <button
                        type="button"
                        className={`${styles.claimButton} ${
                          !unlocked ? styles.claimButtonDisabled : ''
                        }`}
                        onClick={() => setClaimingRewardId(reward.id)}
                        disabled={!unlocked}
                      >
                        Odbierz
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.parentRewardsEmpty}>
              <strong>Brak aktywnych nagród do odbioru.</strong>
              <span>
                Wszystkie obecne nagrody są już oznaczone jako odebrane albo trzeba dodać nowe.
              </span>
            </div>
          )}
        </section>
      )}

      {!display.kidsMode && historyItems.length > 0 && (
        <section className={styles.claimHistoryPanel} aria-label="Historia odbiorów">
          <div className={styles.panelHeader}>
            <h2>Historia odbiorów</h2>
            <span>Widać tu każde odebranie nagrody oraz ewentualne cofnięcia.</span>
          </div>

          <div className={styles.claimHistoryList}>
            {historyItems.map((claim) => (
              <article
                key={claim.id}
                className={`${styles.claimHistoryItem} ${
                  claim.status === 'reverted' ? styles.claimHistoryItemReverted : ''
                }`}
              >
                <span className={styles.claimHistoryEmoji} aria-hidden="true">
                  {claim.rewardEmoji}
                </span>

                <div className={styles.claimHistoryContent}>
                  <div className={styles.claimHistoryTitleRow}>
                    <strong>{claim.rewardTitle}</strong>
                    <span
                      className={`${styles.metaBadge} ${
                        claim.status === 'active'
                          ? styles.metaBadgeActive
                          : styles.metaBadgeReverted
                      }`}
                    >
                      {claim.status === 'active' ? 'Aktywna' : 'Cofnięta'}
                    </span>
                  </div>

                  <div className={styles.claimHistoryMeta}>
                    <span>{AUDIENCE_META[claim.rewardAudience].label}</span>
                    <span>{CLAIM_SOURCE_LABEL[claim.source]}</span>
                    <span>{formatClaimTimestamp(claim.claimedAt)}</span>
                    <span>{formatPoints(claim.pointsSpent)}</span>
                  </div>

                  {claim.status === 'reverted' && claim.revertedAt && (
                    <span className={styles.claimHistoryRevertedAt}>
                      Cofnięto {formatClaimTimestamp(claim.revertedAt)}
                    </span>
                  )}
                </div>

                {claim.status === 'active' && (
                  <button
                    type="button"
                    className={styles.historyRevertButton}
                    onClick={() => handleRevertClaim(claim)}
                  >
                    Cofnij
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {!display.kidsMode && !hasStatsData && (
        <section className={styles.emptyStatePanel} aria-label="Brak danych punktowych">
          <div className={styles.emptyStateHeader}>
            <span className={styles.emptyStateEmoji} aria-hidden="true">
              📊
            </span>
            <div className={styles.emptyStateText}>
              <h2>Statystyki pojawią się po pierwszych zadaniach</h2>
              <p>
                Na razie saldo punktów jest puste. Możesz jednak już przygotować katalog nagród i
                wrócić do dnia, żeby zacząć zbierać punkty.
              </p>
            </div>
          </div>
        </section>
      )}

      {!display.kidsMode && (
        <section className={styles.rewardsManagementPanel} aria-label="Zarządzanie nagrodami">
          <div className={styles.panelHeader}>
            <h2>Katalog nagród</h2>
            <span>Konfiguracja nagród widocznych w sklepie i panelu rodzica.</span>
          </div>

          <div className={styles.rewardsList}>
            {rewards
              .sort((a, b) => a.target - b.target)
              .map((reward) => {
                const claimed = isRewardClaimed(reward.id);

                return (
                  <div
                    key={reward.id}
                    className={`${styles.rewardItem} ${claimed ? styles.rewardItemClaimed : ''}`}
                  >
                    <span className={styles.rewardItemEmoji}>{reward.emoji}</span>
                    <div className={styles.rewardItemInfo}>
                      <strong>{reward.title}</strong>
                      <span>
                        {formatPoints(reward.target)}
                        {reward.audience === 'adult' && ' · Tylko dorosły'}
                        {reward.audience === 'child' && ' · Tylko dziecko'}
                        {reward.audience === 'family' && ' · Dla wszystkich'}
                        {reward.hint ? ` · ${reward.hint}` : ''}
                        {claimed && ' · Aktualnie odebrana'}
                      </span>
                    </div>
                    <div className={styles.rewardItemActions}>
                      <button
                        type="button"
                        className={styles.rewardEditButton}
                        onClick={() => handleEditReward(reward)}
                        aria-label={`Edytuj nagrodę ${reward.title}`}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className={styles.rewardDeleteButton}
                        onClick={() => {
                          const result = deleteReward(reward.id);
                          if (!result.success && result.reason) {
                            showErrorToast(result.reason);
                          }
                        }}
                        aria-label={`Usuń nagrodę ${reward.title}`}
                        disabled={claimed}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
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

      <PinModal
        isOpen={unclaimRewardId !== null}
        onClose={() => setUnclaimRewardId(null)}
        onSubmit={handleUnclaimWithPin}
        title="Cofnij nagrodę"
        description="Aby cofnąć odebraną nagrodę i zwrócić punkty, wpisz PIN rodzica."
        submitLabel="Cofnij nagrodę"
      />

      <RewardClaimModal
        isOpen={parentClaimingReward !== null}
        reward={parentClaimingReward}
        availablePoints={availablePoints}
        onClose={() => setClaimingRewardId(null)}
        onConfirm={handleConfirmParentClaim}
      />

      <RewardModal
        isOpen={isRewardModalOpen}
        onClose={() => {
          setIsRewardModalOpen(false);
          setEditingReward(null);
        }}
        onSave={handleSaveReward}
        reward={editingReward}
        initialAudience={initialAudience}
      />
    </section>
  );
}

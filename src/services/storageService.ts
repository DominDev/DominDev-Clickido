/**
 * Storage Service - Abstraction layer for localStorage
 * Designed for future migration to Supabase/Firebase
 */

import { CustomReward, RewardAudience, RewardClaim, RewardClaimSource, RewardClaimStatus } from '@/types';

const STORAGE_PREFIX = 'ck_';
const CURRENT_VERSION = 5;

// Default rewards created on first run
const DEFAULT_REWARDS: Omit<CustomReward, 'id' | 'createdAt'>[] = [
  { target: 50, emoji: '🍿', title: 'Mała nagroda', hint: 'Krótka przyjemność po dobrym starcie.', audience: 'family' },
  { target: 100, emoji: '🎨', title: 'Poziom 2', hint: 'Czas na większy wybór i więcej zabawy.', audience: 'family' },
  { target: 180, emoji: '🎮', title: 'Super misja', hint: 'Nagroda za regularne zbieranie punktów.', audience: 'family' },
  { target: 260, emoji: '🍕', title: 'Nagroda rodzinna', hint: 'Cel, który naprawdę czuć i widać.', audience: 'family' },
];

// Storage keys
export const STORAGE_KEYS = {
  TASKS: `${STORAGE_PREFIX}tasks`,
  COMPLETIONS: `${STORAGE_PREFIX}completions`,
  REWARDS: `${STORAGE_PREFIX}rewards`,
  CLAIMED_REWARDS: `${STORAGE_PREFIX}claimed_rewards`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  VERSION: `${STORAGE_PREFIX}version`,
  UNDO_BUFFER: `${STORAGE_PREFIX}undo`,
  ONBOARDING_COMPLETE: `${STORAGE_PREFIX}onboarding_complete`,
  INSTALL_BANNER_DISMISSED: `${STORAGE_PREFIX}install_banner_dismissed`,
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Get item from localStorage with JSON parsing
 */
export function getItem<T>(key: StorageKey, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage [${key}]:`, error);
    return defaultValue;
  }
}

/**
 * Set item in localStorage with JSON stringification
 */
export function setItem<T>(key: StorageKey, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage [${key}]:`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeItem(key: StorageKey): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage [${key}]:`, error);
    return false;
  }
}

/**
 * Clear all Clickido data from localStorage
 */
export function clearAll(): boolean {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Export all data as JSON string
 */
export function exportData(): string {
  const rewardClaims = getItem(STORAGE_KEYS.CLAIMED_REWARDS, []);

  const data = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: getItem(STORAGE_KEYS.TASKS, []),
    completions: getItem(STORAGE_KEYS.COMPLETIONS, []),
    rewards: getItem(STORAGE_KEYS.REWARDS, []),
    rewardClaims,
    claimedRewards: rewardClaims,
    settings: getItem(STORAGE_KEYS.SETTINGS, null),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON string
 */
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    // Validate structure
    if (!data.version || !Array.isArray(data.tasks)) {
      throw new Error('Invalid data format');
    }

    // Import data
    setItem(STORAGE_KEYS.TASKS, data.tasks);
    setItem(STORAGE_KEYS.COMPLETIONS, data.completions || []);

    // Import rewards or create defaults
    if (data.rewards && Array.isArray(data.rewards) && data.rewards.length > 0) {
      setItem(STORAGE_KEYS.REWARDS, data.rewards);
    } else {
      // Create default rewards if not present in import
      const defaultRewards = createDefaultRewards();
      setItem(STORAGE_KEYS.REWARDS, defaultRewards);
    }

    // Handle reward claims migration
    if (data.rewardClaims || data.claimedRewards) {
      const rewards = getItem<CustomReward[]>(STORAGE_KEYS.REWARDS, []);
      const migratedClaims = migrateRewardClaims(data.rewardClaims ?? data.claimedRewards, rewards);
      setItem(STORAGE_KEYS.CLAIMED_REWARDS, migratedClaims);
    }

    if (data.settings) {
      setItem(STORAGE_KEYS.SETTINGS, data.settings);
    }
    setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

/**
 * Generate unique ID for rewards
 */
function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateRewardId(): string {
  return createId('reward');
}

function generateRewardClaimId(): string {
  return createId('reward_claim');
}

/**
 * Create default rewards
 */
function createDefaultRewards(): CustomReward[] {
  const now = new Date().toISOString();
  return DEFAULT_REWARDS.map((reward) => ({
    ...reward,
    id: `default_${reward.target}`,
    createdAt: now,
  }));
}

/**
 * Migrate claimed rewards from old formats to new format with rewardId
 */
function resolveRewardAudience(rewardId: string | undefined, rewards: CustomReward[]): RewardAudience {
  if (!rewardId) {
    return 'family';
  }

  return rewards.find((reward) => reward.id === rewardId)?.audience ?? 'family';
}

function isRewardClaimStatus(value: unknown): value is RewardClaimStatus {
  return value === 'active' || value === 'reverted';
}

function isRewardClaimSource(value: unknown): value is RewardClaimSource {
  return value === 'kids' || value === 'parent';
}

function sortRewardClaims(claims: RewardClaim[]): RewardClaim[] {
  return [...claims].sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));
}

function migrateRewardClaims(claimedData: unknown, rewards: CustomReward[]): RewardClaim[] {
  if (!Array.isArray(claimedData)) {
    return [];
  }

  if (claimedData.length === 0) {
    return [];
  }

  // Check if already in newest format
  if (
    typeof claimedData[0] === 'object' &&
    claimedData[0] !== null &&
    'rewardId' in claimedData[0] &&
    'id' in claimedData[0]
  ) {
    return sortRewardClaims(
      (claimedData as Array<Partial<RewardClaim>>)
        .filter((item): item is Partial<RewardClaim> & { rewardId: string; rewardTitle: string; rewardEmoji: string; claimedAt: string; pointsSpent: number } =>
          typeof item.rewardId === 'string' &&
          typeof item.rewardTitle === 'string' &&
          typeof item.rewardEmoji === 'string' &&
          typeof item.claimedAt === 'string' &&
          typeof item.pointsSpent === 'number'
        )
        .map((item) => ({
          id: typeof item.id === 'string' ? item.id : generateRewardClaimId(),
          rewardId: item.rewardId,
          rewardTitle: item.rewardTitle,
          rewardEmoji: item.rewardEmoji,
          rewardAudience: item.rewardAudience ?? resolveRewardAudience(item.rewardId, rewards),
          claimedAt: item.claimedAt,
          pointsSpent: item.pointsSpent,
          source: isRewardClaimSource(item.source) ? item.source : 'kids',
          status: isRewardClaimStatus(item.status) ? item.status : 'active',
          revertedAt: typeof item.revertedAt === 'string' ? item.revertedAt : undefined,
        }))
    );
  }

  // Check if in v3/v4 format (has rewardId but no ledger metadata yet)
  if (
    typeof claimedData[0] === 'object' &&
    claimedData[0] !== null &&
    'rewardId' in claimedData[0]
  ) {
    return sortRewardClaims(
      (claimedData as Array<{ rewardId: string; rewardTitle: string; rewardEmoji: string; claimedAt: string; pointsSpent: number }>)
        .map((item) => ({
          id: generateRewardClaimId(),
          rewardId: item.rewardId,
          rewardTitle: item.rewardTitle,
          rewardEmoji: item.rewardEmoji,
          rewardAudience: resolveRewardAudience(item.rewardId, rewards),
          claimedAt: item.claimedAt,
          pointsSpent: item.pointsSpent,
          source: 'kids',
          status: 'active',
        }))
    );
  }

  // Check if in v2 format (has target but not rewardId)
  if (typeof claimedData[0] === 'object' && claimedData[0] !== null && 'target' in claimedData[0]) {
    return sortRewardClaims(
      (claimedData as Array<{ target: number; claimedAt: string; pointsSpent: number }>)
        .map((item) => {
        const reward = rewards.find((r) => r.target === item.target);
        return {
          id: generateRewardClaimId(),
          rewardId: reward?.id ?? `default_${item.target}`,
          rewardTitle: reward?.title ?? `Nagroda ${item.target}`,
          rewardEmoji: reward?.emoji ?? '🎁',
          rewardAudience: reward?.audience ?? 'family',
          claimedAt: item.claimedAt,
          pointsSpent: item.pointsSpent,
          source: 'kids',
          status: 'active',
        };
        })
    );
  }

  // Convert from v1 format (number[]) to v3 format
  return sortRewardClaims(
    claimedData
      .filter((item): item is number => typeof item === 'number')
      .map((target) => {
        const reward = rewards.find((r) => r.target === target);
        return {
          id: generateRewardClaimId(),
          rewardId: reward?.id ?? `default_${target}`,
          rewardTitle: reward?.title ?? `Nagroda ${target}`,
          rewardEmoji: reward?.emoji ?? '🎁',
          rewardAudience: reward?.audience ?? 'family',
          claimedAt: new Date().toISOString(),
          pointsSpent: target,
          source: 'kids',
          status: 'active' as const,
        };
      })
  );
}

export { generateRewardId, generateRewardClaimId, createDefaultRewards };

/**
 * Check and run migrations if needed
 */
export function runMigrations(): void {
  const storedVersion = getItem(STORAGE_KEYS.VERSION, 0);

  if (storedVersion < CURRENT_VERSION) {
    // Migration v2 -> v3: Add custom rewards and update claimed rewards format
    if (storedVersion < 3) {
      // Create default rewards if not present
      const existingRewards = getItem<CustomReward[]>(STORAGE_KEYS.REWARDS, []);
      if (existingRewards.length === 0) {
        const defaultRewards = createDefaultRewards();
        setItem(STORAGE_KEYS.REWARDS, defaultRewards);
        console.log('Created default rewards');
      }

      // Migrate claimed rewards to new format with rewardId
      const rewards = getItem<CustomReward[]>(STORAGE_KEYS.REWARDS, []);
      const oldClaimed = getItem<unknown>(STORAGE_KEYS.CLAIMED_REWARDS, []);
      const migratedClaims = migrateRewardClaims(oldClaimed, rewards);
      setItem(STORAGE_KEYS.CLAIMED_REWARDS, migratedClaims);
      console.log('Migrated claimed rewards to v3 format');
    }

    // Migration v3 -> v4: Add audience field to rewards
    if (storedVersion < 4) {
      const rewards = getItem<CustomReward[]>(STORAGE_KEYS.REWARDS, []);
      const migratedRewards = rewards.map((reward) => ({
        ...reward,
        audience: reward.audience ?? 'family', // Default to family (visible to all)
      }));
      setItem(STORAGE_KEYS.REWARDS, migratedRewards);
      console.log('Added audience field to rewards (v4 migration)');
    }

    // Migration v4 -> v5: Convert claimed rewards into a reward claim ledger
    if (storedVersion < 5) {
      const rewards = getItem<CustomReward[]>(STORAGE_KEYS.REWARDS, []);
      const oldClaims = getItem<unknown>(STORAGE_KEYS.CLAIMED_REWARDS, []);
      const migratedClaims = migrateRewardClaims(oldClaims, rewards);
      setItem(STORAGE_KEYS.CLAIMED_REWARDS, migratedClaims);
      console.log('Migrated claimed rewards to reward claim ledger (v5 migration)');
    }

    setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    console.log(`Migrated storage from v${storedVersion} to v${CURRENT_VERSION}`);
  }
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { used: number; available: number } {
  let used = 0;
  Object.values(STORAGE_KEYS).forEach((key) => {
    const item = localStorage.getItem(key);
    if (item) {
      used += item.length * 2; // UTF-16 = 2 bytes per char
    }
  });

  // Estimate 5MB limit for localStorage
  const available = 5 * 1024 * 1024 - used;

  return { used, available };
}

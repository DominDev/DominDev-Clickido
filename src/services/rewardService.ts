/**
 * Reward Service - CRUD operations for custom rewards
 */

import { CustomReward, ClaimedReward } from '@/types';
import { getItem, setItem, STORAGE_KEYS, generateRewardId, createDefaultRewards } from './storageService';

/**
 * Get all custom rewards
 */
export function getAllRewards(): CustomReward[] {
  const rewards = getItem<CustomReward[]>(STORAGE_KEYS.REWARDS, []);

  // If no rewards exist, create defaults
  if (rewards.length === 0) {
    const defaultRewards = createDefaultRewards();
    setItem(STORAGE_KEYS.REWARDS, defaultRewards);
    return defaultRewards;
  }

  return rewards;
}

/**
 * Get reward by ID
 */
export function getRewardById(id: string): CustomReward | null {
  const rewards = getAllRewards();
  return rewards.find((r) => r.id === id) ?? null;
}

/**
 * Create a new reward
 */
export function createReward(data: Omit<CustomReward, 'id' | 'createdAt'>): CustomReward {
  const rewards = getAllRewards();

  const newReward: CustomReward = {
    ...data,
    id: generateRewardId(),
    createdAt: new Date().toISOString(),
  };

  rewards.push(newReward);
  setItem(STORAGE_KEYS.REWARDS, rewards);

  return newReward;
}

/**
 * Update an existing reward
 */
export function updateReward(id: string, data: Partial<Omit<CustomReward, 'id' | 'createdAt'>>): CustomReward | null {
  const rewards = getAllRewards();
  const index = rewards.findIndex((r) => r.id === id);

  if (index === -1) {
    return null;
  }

  const updated: CustomReward = {
    ...rewards[index],
    ...data,
  };

  rewards[index] = updated;
  setItem(STORAGE_KEYS.REWARDS, rewards);

  return updated;
}

/**
 * Delete a reward (only if not claimed)
 */
export function deleteReward(id: string): { success: boolean; reason?: string } {
  const rewards = getAllRewards();
  const claimedRewards = getItem<ClaimedReward[]>(STORAGE_KEYS.CLAIMED_REWARDS, []);

  // Check if reward exists
  const rewardIndex = rewards.findIndex((r) => r.id === id);
  if (rewardIndex === -1) {
    return { success: false, reason: 'Nagroda nie istnieje.' };
  }

  // Check if reward has been claimed
  const isClaimed = claimedRewards.some((c) => c.rewardId === id);
  if (isClaimed) {
    return { success: false, reason: 'Nie można usunąć odebranej nagrody.' };
  }

  // Remove reward
  rewards.splice(rewardIndex, 1);
  setItem(STORAGE_KEYS.REWARDS, rewards);

  return { success: true };
}

/**
 * Get all claimed rewards
 */
export function getClaimedRewards(): ClaimedReward[] {
  return getItem<ClaimedReward[]>(STORAGE_KEYS.CLAIMED_REWARDS, []);
}

/**
 * Claim a reward
 */
export function claimReward(rewardId: string): ClaimedReward | null {
  const reward = getRewardById(rewardId);
  if (!reward) {
    return null;
  }

  const claimedRewards = getClaimedRewards();

  // Check if already claimed
  const alreadyClaimed = claimedRewards.some((c) => c.rewardId === rewardId);
  if (alreadyClaimed) {
    return claimedRewards.find((c) => c.rewardId === rewardId) ?? null;
  }

  const newClaimed: ClaimedReward = {
    rewardId: reward.id,
    rewardTitle: reward.title,
    rewardEmoji: reward.emoji,
    claimedAt: new Date().toISOString(),
    pointsSpent: reward.target,
  };

  claimedRewards.push(newClaimed);
  setItem(STORAGE_KEYS.CLAIMED_REWARDS, claimedRewards);

  return newClaimed;
}

/**
 * Unclaim a reward (return points)
 */
export function unclaimReward(rewardId: string): ClaimedReward[] {
  const claimedRewards = getClaimedRewards();
  const filtered = claimedRewards.filter((c) => c.rewardId !== rewardId);

  if (filtered.length !== claimedRewards.length) {
    setItem(STORAGE_KEYS.CLAIMED_REWARDS, filtered);
  }

  return filtered;
}

/**
 * Check if reward is claimed
 */
export function isRewardClaimed(rewardId: string): boolean {
  const claimedRewards = getClaimedRewards();
  return claimedRewards.some((c) => c.rewardId === rewardId);
}

/**
 * Get total points spent on rewards
 */
export function getTotalSpentPoints(): number {
  const claimedRewards = getClaimedRewards();
  return claimedRewards.reduce((sum, c) => sum + c.pointsSpent, 0);
}

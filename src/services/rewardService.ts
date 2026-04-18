/**
 * Reward Service - CRUD operations for custom rewards and reward claim ledger
 */

import { CustomReward, RewardClaim, RewardClaimSource } from '@/types';
import {
  getItem,
  setItem,
  STORAGE_KEYS,
  generateRewardId,
  generateRewardClaimId,
  createDefaultRewards,
} from './storageService';

function sortClaimsNewestFirst(claims: RewardClaim[]): RewardClaim[] {
  return [...claims].sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));
}

/**
 * Get all custom rewards
 */
export function getAllRewards(): CustomReward[] {
  const rewards = getItem<CustomReward[]>(STORAGE_KEYS.REWARDS, []);

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
  return rewards.find((reward) => reward.id === id) ?? null;
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
export function updateReward(
  id: string,
  data: Partial<Omit<CustomReward, 'id' | 'createdAt'>>
): CustomReward | null {
  const rewards = getAllRewards();
  const index = rewards.findIndex((reward) => reward.id === id);

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
 * Delete a reward (only if it does not have an active claim)
 */
export function deleteReward(id: string): { success: boolean; reason?: string } {
  const rewards = getAllRewards();
  const rewardIndex = rewards.findIndex((reward) => reward.id === id);

  if (rewardIndex === -1) {
    return { success: false, reason: 'Nagroda nie istnieje.' };
  }

  if (hasActiveRewardClaim(id)) {
    return {
      success: false,
      reason: 'Nie można usunąć nagrody, która jest obecnie oznaczona jako odebrana.',
    };
  }

  rewards.splice(rewardIndex, 1);
  setItem(STORAGE_KEYS.REWARDS, rewards);

  return { success: true };
}

/**
 * Get full reward claim history
 */
export function getRewardClaims(): RewardClaim[] {
  const claims = getItem<RewardClaim[]>(STORAGE_KEYS.CLAIMED_REWARDS, []);
  return sortClaimsNewestFirst(claims);
}

/**
 * Get active reward claims only
 */
export function getActiveRewardClaims(): RewardClaim[] {
  return getRewardClaims().filter((claim) => claim.status === 'active');
}

/**
 * Check if reward has an active claim
 */
export function hasActiveRewardClaim(rewardId: string): boolean {
  return getActiveRewardClaims().some((claim) => claim.rewardId === rewardId);
}

/**
 * Get the latest active claim for a reward
 */
export function getLatestActiveRewardClaim(rewardId: string): RewardClaim | null {
  return getActiveRewardClaims().find((claim) => claim.rewardId === rewardId) ?? null;
}

/**
 * Claim a reward into the ledger
 */
export function claimReward(
  rewardId: string,
  source: RewardClaimSource = 'parent'
): RewardClaim | null {
  const reward = getRewardById(rewardId);
  if (!reward) {
    return null;
  }

  const claims = getRewardClaims();
  const existingActiveClaim = claims.find(
    (claim) => claim.rewardId === rewardId && claim.status === 'active'
  );

  if (existingActiveClaim) {
    return existingActiveClaim;
  }

  const newClaim: RewardClaim = {
    id: generateRewardClaimId(),
    rewardId: reward.id,
    rewardTitle: reward.title,
    rewardEmoji: reward.emoji,
    rewardAudience: reward.audience,
    claimedAt: new Date().toISOString(),
    pointsSpent: reward.target,
    source,
    status: 'active',
  };

  setItem(STORAGE_KEYS.CLAIMED_REWARDS, [newClaim, ...claims]);
  return newClaim;
}

/**
 * Revert a claim by claim ID and return points to the wallet
 */
export function revertRewardClaim(claimId: string): RewardClaim | null {
  const claims = getRewardClaims();
  const claim = claims.find((entry) => entry.id === claimId);

  if (!claim || claim.status !== 'active') {
    return null;
  }

  const revertedAt = new Date().toISOString();
  const updatedClaims = claims.map((entry) =>
    entry.id === claimId
      ? {
          ...entry,
          status: 'reverted' as const,
          revertedAt,
        }
      : entry
  );

  setItem(STORAGE_KEYS.CLAIMED_REWARDS, updatedClaims);

  return {
    ...claim,
    status: 'reverted',
    revertedAt,
  };
}

/**
 * Revert the latest active claim for a reward ID
 */
export function unclaimReward(rewardId: string): RewardClaim | null {
  const latestActiveClaim = getLatestActiveRewardClaim(rewardId);

  if (!latestActiveClaim) {
    return null;
  }

  return revertRewardClaim(latestActiveClaim.id);
}

/**
 * Get total points currently spent on active reward claims
 */
export function getTotalSpentPoints(): number {
  return getActiveRewardClaims().reduce((sum, claim) => sum + claim.pointsSpent, 0);
}

import { ECONOMY_CONFIG } from '../config.ts';
import type { EconomyState, ClaimResult } from './types.ts';

export function createInitialEconomyState(isPractice = false): EconomyState {
  return {
    score: 0,
    allocation: 0,
    lastClaimAt: 0,
    itemsCollected: 0,
    isPractice
  };
}

/**
 * Pure rule evaluation for point claims in Flaunch Game Mode.
 * Ensures economy bounds, rate-limits, and ceilings are strictly respected.
 */
export function validateAndApplyClaim(
  currentState: EconomyState,
  points: number,
  currentTimeMs: number,
  isRoundOpen: boolean
): { state: EconomyState; result: ClaimResult } {
  // Practice gating: no real allocation during practice
  if (currentState.isPractice) {
    const updatedState: EconomyState = {
      ...currentState,
      score: currentState.score + points,
      itemsCollected: currentState.itemsCollected + 1,
      lastClaimAt: currentTimeMs
    };
    return {
      state: updatedState,
      result: {
        success: true,
        awardedPoints: points,
        newTotalScore: updatedState.score,
        newAllocation: 0,
        reason: 'practice_mode'
      }
    };
  }

  // Round closed check
  if (!isRoundOpen) {
    return {
      state: currentState,
      result: {
        success: false,
        awardedPoints: 0,
        newTotalScore: currentState.score,
        newAllocation: currentState.allocation,
        reason: 'round_closed'
      }
    };
  }

  // Invalid points check
  if (points <= 0 || points > ECONOMY_CONFIG.maxClaimPoints) {
    return {
      state: currentState,
      result: {
        success: false,
        awardedPoints: 0,
        newTotalScore: currentState.score,
        newAllocation: currentState.allocation,
        reason: 'invalid_points'
      }
    };
  }

  // Rate-limiting check
  if (currentState.lastClaimAt > 0 && currentTimeMs - currentState.lastClaimAt < ECONOMY_CONFIG.minMsBetweenClaims) {
    return {
      state: currentState,
      result: {
        success: false,
        awardedPoints: 0,
        newTotalScore: currentState.score,
        newAllocation: currentState.allocation,
        reason: 'too_fast'
      }
    };
  }

  // Ceiling check: clamp if exceeding maxGamePoints
  const availableRoom = ECONOMY_CONFIG.maxGamePoints - currentState.score;
  if (availableRoom <= 0) {
    return {
      state: currentState,
      result: {
        success: false,
        awardedPoints: 0,
        newTotalScore: currentState.score,
        newAllocation: currentState.allocation,
        reason: 'exceeds_max'
      }
    };
  }

  const effectivePoints = Math.min(points, availableRoom);
  const newScore = currentState.score + effectivePoints;
  const newAllocation = Number((newScore * ECONOMY_CONFIG.allocationPerPoint).toFixed(2));

  const nextState: EconomyState = {
    ...currentState,
    score: newScore,
    allocation: newAllocation,
    lastClaimAt: currentTimeMs,
    itemsCollected: currentState.itemsCollected + 1
  };

  return {
    state: nextState,
    result: {
      success: true,
      awardedPoints: effectivePoints,
      newTotalScore: newScore,
      newAllocation: newAllocation
    }
  };
}

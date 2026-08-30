import { GAME_CONFIG } from '../config.ts';

export function calcProgress(currentY: number, spawnY = GAME_CONFIG.spawnY, playerY = GAME_CONFIG.playerY): number {
  const totalDist = playerY - spawnY;
  return Math.max(0, Math.min(1.6, (currentY - spawnY) / totalDist));
}

export function calcLaneX(laneIndex: number, currentY: number): number {
  const startX = GAME_CONFIG.spawnLanesX[laneIndex] ?? 207;
  const targetX = GAME_CONFIG.targetLanesX[laneIndex] ?? 207;
  const progress = calcProgress(currentY);
  return startX + (targetX - startX) * progress;
}

export function calcScale(currentY: number): number {
  if (currentY <= GAME_CONFIG.playerY) {
    const progress = calcProgress(currentY);
    return 0.14 + (1.0 - 0.14) * progress;
  } else {
    const exitProgress = (currentY - GAME_CONFIG.playerY) / (GAME_CONFIG.exitY - GAME_CONFIG.playerY);
    return 1.0 + (1.20 - 1.0) * Math.max(0, Math.min(1, exitProgress));
  }
}

export function calcAlpha(currentY: number): number {
  if (currentY <= GAME_CONFIG.playerY) {
    const progress = calcProgress(currentY);
    const alphaProgress = progress / 0.22; // Emerges from table horizon
    return Math.min(1.0, Math.max(0.0, alphaProgress));
  } else {
    if (currentY >= 680.0) {
      return Math.max(0.0, (GAME_CONFIG.exitY - currentY) / 56.0);
    }
    return 1.0;
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

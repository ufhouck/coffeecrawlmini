import { GAME_CONFIG } from '../config.ts';
import { roomInstance } from '../room.ts';
import type { ClaimResult } from '../game/types.ts';

export interface ScoreManagerCallbacks {
  onScoreUpdate?: (score: number, allocation: number, multiplier: number) => void;
  onLivesUpdate?: (lives: number) => void;
  onLevelUpdate?: (level: number, progress: number, target: number) => void;
  onDiscoModeChange?: (active: boolean, remainingSec: number) => void;
  onSlowModeChange?: (active: boolean, remainingSec: number) => void;
  onFastModeChange?: (active: boolean, remainingSec: number) => void;
  onGameOver?: () => void;
}

export class ScoreManager {
  public score = 0;
  public allocation = 0;
  public lives = GAME_CONFIG.maxLives;
  public currentLevel = 1;
  public levelProgress = 0;

  public isDiscoMode = false;
  public discoTimeRemaining = 0;

  public isSlowMode = false;
  public slowTimeRemaining = 0;

  public isFastMode = false;
  public fastTimeRemaining = 0;

  private callbacks: ScoreManagerCallbacks = {};

  constructor(callbacks?: ScoreManagerCallbacks) {
    if (callbacks) this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: ScoreManagerCallbacks) {
    this.callbacks = callbacks;
  }

  public reset() {
    this.score = 0;
    this.allocation = 0;
    this.lives = GAME_CONFIG.maxLives;
    this.currentLevel = 1;
    this.levelProgress = 0;
    this.isDiscoMode = false;
    this.discoTimeRemaining = 0;
    this.isSlowMode = false;
    this.slowTimeRemaining = 0;
    this.isFastMode = false;
    this.fastTimeRemaining = 0;

    this.notifyAll();
  }

  public update(deltaSec: number) {
    // Disco mode timer
    if (this.isDiscoMode) {
      this.discoTimeRemaining -= deltaSec;
      if (this.discoTimeRemaining <= 0) {
        this.isDiscoMode = false;
        this.discoTimeRemaining = 0;
        this.callbacks.onDiscoModeChange?.(false, 0);
      } else {
        this.callbacks.onDiscoModeChange?.(true, this.discoTimeRemaining);
      }
    }

    // Slow mode timer
    if (this.isSlowMode) {
      this.slowTimeRemaining -= deltaSec;
      if (this.slowTimeRemaining <= 0) {
        this.isSlowMode = false;
        this.slowTimeRemaining = 0;
        this.callbacks.onSlowModeChange?.(false, 0);
      } else {
        this.callbacks.onSlowModeChange?.(true, this.slowTimeRemaining);
      }
    }

    // Fast mode timer
    if (this.isFastMode) {
      this.fastTimeRemaining -= deltaSec;
      if (this.fastTimeRemaining <= 0) {
        this.isFastMode = false;
        this.fastTimeRemaining = 0;
        this.callbacks.onFastModeChange?.(false, 0);
      } else {
        this.callbacks.onFastModeChange?.(true, this.fastTimeRemaining);
      }
    }
  }

  public addCollectiblePoints(basePoints: number): ClaimResult {
    let effectivePoints = basePoints;
    if (this.isDiscoMode && basePoints > 0) {
      effectivePoints *= 2;
    } else if (this.isFastMode && basePoints > 0) {
      effectivePoints = Math.round(effectivePoints * 1.5);
    }

    // Claim points via Flaunch room
    const claimResult = roomInstance.claimPoints(effectivePoints);

    if (claimResult.success) {
      this.score = claimResult.newTotalScore;
      this.allocation = claimResult.newAllocation;
      this.levelProgress += 1;

      const target = GAME_CONFIG.targetPickups(this.currentLevel);
      if (this.levelProgress >= target) {
        this.levelProgress = 0;
        this.currentLevel += 1;
        // Level up trigger disco every 10 levels
        if (this.currentLevel % 10 === 0) {
          this.triggerDiscoMode();
        }
      }

      this.notifyAll();
    }

    return claimResult;
  }

  public addLife(): boolean {
    if (this.lives < GAME_CONFIG.maxLives) {
      this.lives += 1;
      this.callbacks.onLivesUpdate?.(this.lives);
      return true;
    }
    return false;
  }

  public takeDamage(): boolean {
    this.lives = Math.max(0, this.lives - 1);
    this.callbacks.onLivesUpdate?.(this.lives);

    if (this.lives <= 0) {
      this.callbacks.onGameOver?.();
      return true; // Game over
    }
    return false;
  }

  public triggerDiscoMode() {
    this.isDiscoMode = true;
    this.discoTimeRemaining = GAME_CONFIG.discoModeDuration;
    this.callbacks.onDiscoModeChange?.(true, this.discoTimeRemaining);
  }

  public triggerSlowMode() {
    this.isSlowMode = true;
    this.isFastMode = false; // mutually exclusive
    this.fastTimeRemaining = 0;
    this.callbacks.onFastModeChange?.(false, 0);
    this.slowTimeRemaining = GAME_CONFIG.slowModeDuration;
    this.callbacks.onSlowModeChange?.(true, this.slowTimeRemaining);
  }

  public triggerFastMode() {
    this.isFastMode = true;
    this.isSlowMode = false; // mutually exclusive
    this.slowTimeRemaining = 0;
    this.callbacks.onSlowModeChange?.(false, 0);
    this.fastTimeRemaining = 10; // 10 seconds fast mode
    this.callbacks.onFastModeChange?.(true, this.fastTimeRemaining);
  }

  public getCurrentSpeed(): number {
    let speed = GAME_CONFIG.baseSpeed + (this.currentLevel - 1) * GAME_CONFIG.speedPerLevel;
    if (this.isSlowMode) {
      speed *= 0.65; // 35% speed reduction
    } else if (this.isFastMode) {
      speed *= 1.45; // 45% speed increase
    }
    return Math.min(GAME_CONFIG.maxSpeed, speed);
  }

  private notifyAll() {
    let mult = 1;
    if (this.isDiscoMode) mult = 2;
    else if (this.isFastMode) mult = 1.5;

    this.callbacks.onScoreUpdate?.(this.score, this.allocation, mult);
    this.callbacks.onLivesUpdate?.(this.lives);
    this.callbacks.onLevelUpdate?.(
      this.currentLevel,
      this.levelProgress,
      GAME_CONFIG.targetPickups(this.currentLevel)
    );
  }
}

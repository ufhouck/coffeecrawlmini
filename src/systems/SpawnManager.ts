import type { PlannedSpawn, CollectibleType, ObstacleType } from '../game/types.ts';

export class SpawnManager {
  private spawnQueue: PlannedSpawn[] = [];
  private spawnTimer = 0;
  private spawnInterval = 1.0;

  public reset() {
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
  }

  public update(
    deltaSec: number,
    currentSpeed: number,
    currentLevel: number,
    onSpawn: (laneIndex: number, isObstacle: boolean, collectibleType?: CollectibleType, obstacleType?: ObstacleType) => void
  ) {
    this.spawnTimer += deltaSec;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.processNextSpawn(currentSpeed, currentLevel, onSpawn);
    }
  }

  private processNextSpawn(
    currentSpeed: number,
    currentLevel: number,
    onSpawn: (laneIndex: number, isObstacle: boolean, collectibleType?: CollectibleType, obstacleType?: ObstacleType) => void
  ) {
    if (this.spawnQueue.length === 0) {
      this.generateWave();
    }

    if (this.spawnQueue.length > 0) {
      const item = this.spawnQueue.shift()!;
      
      // Determine if obstacle or collectible
      const roll = Math.random() * 100;
      // Level-based obstacle probability: starts easier, gets harder
      let obstacleThreshold = 65; // base: 35% obstacle chance
      if (currentLevel > 5) obstacleThreshold = 55;   // 45%
      if (currentLevel > 15) obstacleThreshold = 48;   // 52%
      if (currentLevel > 30) obstacleThreshold = 40;   // 60%
      const isObstacle = item.forceObstacle || (!item.forceCollectible && roll >= obstacleThreshold);

      if (isObstacle) {
        const obstacles: ObstacleType[] = ['spilledCoffee', 'brokenCup', 'hotPot'];
        const randomObstacle = obstacles[Math.floor(Math.random() * obstacles.length)];
        onSpawn(item.laneIndex, true, undefined, randomObstacle);
      } else {
        const collectibleType = item.specificCollectible ?? this.pickCollectibleType(currentLevel);
        onSpawn(item.laneIndex, false, collectibleType, undefined);
      }

      // Spacing between items
      if (this.spawnQueue.length > 0) {
        this.spawnInterval = Math.max(0.18, 120.0 / currentSpeed);
      } else {
        this.spawnInterval = Math.max(0.35, 260.0 / currentSpeed);
      }
    }
  }

  private generateWave() {
    const patternRoll = Math.floor(Math.random() * 100);

    if (patternRoll < 20) {
      // 1. Zig-Zag Coins (Left -> Middle -> Right or Right -> Middle -> Left)
      const leftToRight = Math.random() < 0.5;
      const order = leftToRight ? [0, 1, 2] : [2, 1, 0];
      for (const lane of order) {
        this.spawnQueue.push({ laneIndex: lane, forceObstacle: false, forceCollectible: true });
      }
    } else if (patternRoll < 40) {
      // 2. Double Blocker (2 lanes blocked, 1 open lane)
      const openLane = Math.floor(Math.random() * 3);
      for (let lane = 0; lane < 3; lane++) {
        if (lane !== openLane) {
          this.spawnQueue.push({ laneIndex: lane, forceObstacle: true, forceCollectible: false });
        }
      }
    } else if (patternRoll < 60) {
      // 3. Dual Lane Divergence (Lane 1 has collectible, Lane 2 has obstacle - never directly stacked)
      const colLane = Math.floor(Math.random() * 3);
      let obsLane = Math.floor(Math.random() * 3);
      while (obsLane === colLane) obsLane = Math.floor(Math.random() * 3);

      this.spawnQueue.push({ laneIndex: colLane, forceObstacle: false, forceCollectible: true });
      this.spawnQueue.push({ laneIndex: obsLane, forceObstacle: true, forceCollectible: false });
    } else if (patternRoll < 80) {
      // 4. Speeder Coins (3 sequential items in random lanes)
      for (let i = 0; i < 3; i++) {
        const randLane = Math.floor(Math.random() * 3);
        this.spawnQueue.push({ laneIndex: randLane, forceObstacle: false, forceCollectible: true });
      }
    } else if (patternRoll < 88) {
      // 5. Standard Spawn (1 or 2 items)
      const lane1 = Math.floor(Math.random() * 3);
      const isDual = Math.random() < 0.35;
      if (isDual) {
        let lane2 = Math.floor(Math.random() * 3);
        while (lane2 === lane1) lane2 = Math.floor(Math.random() * 3);
        this.spawnQueue.push({ laneIndex: lane1, forceObstacle: true, forceCollectible: false });
        this.spawnQueue.push({ laneIndex: lane2, forceObstacle: false, forceCollectible: true });
      } else {
        this.spawnQueue.push({ laneIndex: lane1, forceObstacle: false, forceCollectible: false });
      }
    } else {
      // 6. Gold Chain Rush (5 gold beans in a row)
      const goldLane = Math.floor(Math.random() * 3);
      for (let i = 0; i < 5; i++) {
        this.spawnQueue.push({
          laneIndex: goldLane,
          forceObstacle: false,
          forceCollectible: true,
          specificCollectible: 'goldBean'
        });
      }
    }
  }

  private pickCollectibleType(currentLevel: number): CollectibleType {
    const roll = Math.random() * 100;

    // Heart probability (decays with level, min 3.5%)
    const heartProb = Math.max(3.5, 6.0 - (currentLevel - 1) * 0.02);
    if (roll < heartProb) return 'heartCup';

    // Timer probability (3% - 6%) — 50% slowTimer, 50% fastTimer
    const timerProb = Math.max(3.0, 6.0 - (currentLevel - 1) * 0.03);
    if (roll < heartProb + timerProb) {
      return Math.random() < 0.5 ? 'slowTimer' : 'fastTimer';
    }

    // Honey bean probability (3% -> triggers Disco Mode)
    if (roll < heartProb + timerProb + 3.0) return 'honeyBean';

    // Standard pool
    const pool: CollectibleType[] = [
      'normalBean', 'normalBean', 'normalBean',
      'sugar', 'sugar',
      'goldBean', 'goldBean',
      'cherry',
      'croissant',
      'milk',
      'matcha'
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

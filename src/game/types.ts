export type CollectibleType =
  | 'normalBean'
  | 'goldBean'
  | 'sugar'
  | 'cherry'
  | 'croissant'
  | 'honeyBean'
  | 'heartCup'
  | 'slowTimer'
  | 'fastTimer'
  | 'milk'
  | 'matcha';

export type ObstacleType =
  | 'spilledCoffee'
  | 'brokenCup'
  | 'hotPot';

export type GameState = 'welcome' | 'playing' | 'gameOver' | 'ended';

export interface PlannedSpawn {
  laneIndex: number;
  forceObstacle: boolean;
  forceCollectible: boolean;
  specificCollectible?: CollectibleType;
}

export interface EconomyState {
  score: number;
  allocation: number;
  lastClaimAt: number;
  itemsCollected: number;
  isPractice: boolean;
}

export interface ClaimResult {
  success: boolean;
  awardedPoints: number;
  newTotalScore: number;
  newAllocation: number;
  reason?: 'too_fast' | 'exceeds_max' | 'practice_mode' | 'round_closed' | 'invalid_points';
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  allocation: number;
  isSelf?: boolean;
}

export interface MarketData {
  ticker: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: string;
  history: number[];
}

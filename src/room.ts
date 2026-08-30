import { ECONOMY_CONFIG } from './config.ts';
import { createInitialEconomyState, validateAndApplyClaim } from './game/rules.ts';
import type { EconomyState, ClaimResult, LeaderboardEntry, MarketData } from './game/types.ts';

export interface RoomEventListener {
  onTimerTick?: (remainingSeconds: number, totalSeconds: number, isPractice: boolean, opensInSeconds: number) => void;
  onStateChange?: (state: EconomyState, claimResult?: ClaimResult) => void;
  onLeaderboardUpdate?: (entries: LeaderboardEntry[]) => void;
  onRoundEnd?: (finalState: EconomyState) => void;
}

export class GameRoom {
  private state: EconomyState;
  private listeners: RoomEventListener = {};
  private timerInterval: number | null = null;
  
  public opensAt: number;
  public closesAt: number;
  public isPractice: boolean;
  public isRoundEnded = false;

  private marketData: MarketData = {
    ticker: '$BEAN',
    name: 'Coffee Crawl Bean',
    price: 0.0425,
    change24h: 18.4,
    marketCap: '$425,000',
    history: [0.031, 0.033, 0.032, 0.036, 0.035, 0.039, 0.041, 0.0425]
  };

  private mockRivals: LeaderboardEntry[] = [
    { rank: 1, name: 'EspressoChad', score: 620, allocation: 77.50 },
    { rank: 2, name: 'BaristaPro', score: 480, allocation: 60.00 },
    { rank: 3, name: 'LatteArtisan', score: 350, allocation: 43.75 },
    { rank: 4, name: 'BeanRunner99', score: 210, allocation: 26.25 },
    { rank: 5, name: 'MochaKing', score: 140, allocation: 17.50 }
  ];

  constructor() {
    this.isPractice = false;
    this.opensAt = Date.now();
    this.closesAt = Date.now() + ECONOMY_CONFIG.defaultRoundSeconds * 1000;
    this.state = createInitialEconomyState(false);
    this.initFromUrl();
  }

  private initFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const forcePractice = urlParams.get('practice') === 'true';
    const now = Date.now();

    if (forcePractice) {
      this.isPractice = true;
      this.opensAt = now + ECONOMY_CONFIG.practiceSeconds * 1000;
      this.closesAt = this.opensAt + ECONOMY_CONFIG.defaultRoundSeconds * 1000;
    } else {
      this.isPractice = false;
      this.opensAt = now;
      this.closesAt = now + ECONOMY_CONFIG.defaultRoundSeconds * 1000;
    }

    this.state = createInitialEconomyState(this.isPractice);
  }

  /** Reset the room for a new round (respects ?practice=true parameter) */
  public reset() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forcePractice = urlParams?.get('practice') === 'true';
    const now = Date.now();

    if (forcePractice) {
      this.isPractice = true;
      this.opensAt = now + ECONOMY_CONFIG.practiceSeconds * 1000;
      this.closesAt = this.opensAt + ECONOMY_CONFIG.defaultRoundSeconds * 1000;
    } else {
      this.isPractice = false;
      this.opensAt = now;
      this.closesAt = now + ECONOMY_CONFIG.defaultRoundSeconds * 1000;
    }

    this.isRoundEnded = false;
    this.state = createInitialEconomyState(this.isPractice);

    this.startClock();
  }

  public setListener(listener: RoomEventListener) {
    this.listeners = listener;
  }

  public startClock() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = window.setInterval(() => {
      const now = Date.now();

      if (this.isPractice && now >= this.opensAt) {
        this.isPractice = false;
        this.state = {
          ...this.state,
          isPractice: false,
          score: 0,
          allocation: 0
        };
        this.listeners.onStateChange?.(this.state);
      }

      if (now >= this.closesAt) {
        if (!this.isRoundEnded) {
          this.isRoundEnded = true;
          this.listeners.onRoundEnd?.(this.state);
          if (this.timerInterval) clearInterval(this.timerInterval);
        }
      }

      const remainingSec = Math.max(0, Math.ceil((this.closesAt - now) / 1000));
      const totalSec = ECONOMY_CONFIG.defaultRoundSeconds;
      const opensInSec = Math.max(0, Math.ceil((this.opensAt - now) / 1000));

      this.listeners.onTimerTick?.(remainingSec, totalSec, this.isPractice, opensInSec);
    }, 500);
  }

  public claimPoints(points: number): ClaimResult {
    const now = Date.now();
    const isRoundOpen = !this.isRoundEnded && (this.isPractice || now < this.closesAt);

    const { state: nextState, result } = validateAndApplyClaim(
      this.state,
      points,
      now,
      isRoundOpen
    );

    this.state = nextState;
    if (result.success) {
      this.listeners.onStateChange?.(this.state, result);
      this.updateLeaderboard();
    }
    return result;
  }

  public getState(): EconomyState {
    return this.state;
  }

  public getMarketData(): MarketData {
    return this.marketData;
  }

  public getLeaderboard(): LeaderboardEntry[] {
    const playerEntry: LeaderboardEntry = {
      rank: 1,
      name: 'You (Barista)',
      score: this.state.score,
      allocation: this.state.allocation,
      isSelf: true
    };

    const all = [...this.mockRivals, playerEntry].sort((a, b) => b.score - a.score);
    return all.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }

  private updateLeaderboard() {
    this.listeners.onLeaderboardUpdate?.(this.getLeaderboard());
  }

  public async buyToken(amount: number): Promise<boolean> {
    console.log(`[Flaunch Room] BUY executed for $${amount}`);
    return true;
  }

  public destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

export const roomInstance = new GameRoom();

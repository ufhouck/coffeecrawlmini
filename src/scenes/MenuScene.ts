import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.ts';
import { LeaderboardModalUI } from '../ui/Leaderboard.ts';
import { TutorialModalUI } from '../ui/Modals.ts';
import { CoinPanelUI } from '../ui/CoinPanel.ts';
import { roomInstance } from '../room.ts';

export class MenuScene extends Phaser.Scene {
  private leaderboardUI!: LeaderboardModalUI;
  private tutorialModalUI!: TutorialModalUI;
  private coinPanelUI!: CoinPanelUI;

  constructor() {
    super({ key: 'MenuScene' });
  }

  public create() {
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;

    this.leaderboardUI = new LeaderboardModalUI();
    this.tutorialModalUI = new TutorialModalUI();
    this.coinPanelUI = new CoinPanelUI();
    this.coinPanelUI.hide(); // Hide CoinPanel in lobby

    // Hide game HUD, sound button, and banners in menu
    const hudEl = document.getElementById('dom-hud');
    if (hudEl) hudEl.style.display = 'none';
    const discoEl = document.getElementById('disco-banner');
    if (discoEl) discoEl.style.display = 'none';
    const fastEl = document.getElementById('fast-banner');
    if (fastEl) fastEl.style.display = 'none';
    const timerEl = document.getElementById('round-timer');
    if (timerEl) timerEl.style.display = 'none';
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) soundBtn.style.display = 'none';
    const hpContainer = document.getElementById('hud-hp-container');
    if (hpContainer) hpContainer.style.display = 'none';

    // Show menu overlay
    const menuOverlay = document.getElementById('menu-dom-overlay');
    if (menuOverlay) menuOverlay.style.display = 'flex';

    // Background
    const bg = this.add.image(W / 2, H / 2, 'bg_cafe');
    bg.setDisplaySize(W, H);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x060302, 0.65);
    overlay.fillRect(0, 0, W, H);

    // Update best score display
    const rawBest = localStorage.getItem('coffeecrawl_high_score') || '0';
    const bestScoreNum = parseInt(rawBest, 10);
    const bestScoreEl = document.getElementById('menu-best-score');
    if (bestScoreEl) {
      if (bestScoreNum > 0) {
        bestScoreEl.style.display = 'block';
        bestScoreEl.innerText = `YOUR BEST: ${bestScoreNum.toLocaleString()} pts`;
      } else {
        bestScoreEl.style.display = 'none';
      }
    }

    // Check if tutorial needed on first launch
    const tutorialDone = localStorage.getItem('coffeecrawl_tutorial_done') === 'true';
    if (!tutorialDone) {
      this.tutorialModalUI.show(() => {
        localStorage.setItem('coffeecrawl_tutorial_done', 'true');
      });
    }

    // Wire menu buttons and keyboard
    this.wireMenuButtons();
    this.wireKeyboardControls();
  }

  private wireMenuButtons() {
    const startBtn = document.getElementById('menu-start-btn');
    const tutorialBtn = document.getElementById('menu-tutorial-btn');
    const ranksBtn = document.getElementById('menu-ranks-btn');

    if (startBtn) {
      startBtn.onclick = () => {
        this.startGame();
      };
    }

    if (tutorialBtn) {
      tutorialBtn.onclick = () => {
        this.tutorialModalUI.show(() => {
          localStorage.setItem('coffeecrawl_tutorial_done', 'true');
        });
      };
    }

    if (ranksBtn) {
      ranksBtn.onclick = () => {
        this.leaderboardUI.show(roomInstance.getLeaderboard(), () => {});
      };
    }
  }

  private wireKeyboardControls() {
    if (!this.input.keyboard) return;

    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        // If tutorial is visible, advance tutorial
        const tutModal = document.getElementById('tutorial-modal');
        if (tutModal && tutModal.style.display === 'flex') {
          const nextBtn = document.getElementById('tutorial-next');
          nextBtn?.click();
          return;
        }

        // If leaderboard is visible, close it
        const lbModal = document.getElementById('leaderboard-modal');
        if (lbModal && lbModal.style.display === 'flex') {
          this.leaderboardUI.hide();
          return;
        }

        // Otherwise start game
        this.startGame();
      }
    });
  }

  private startGame() {
    const menuOverlay = document.getElementById('menu-dom-overlay');
    if (menuOverlay) menuOverlay.style.display = 'none';
    this.scene.start('GameScene');
  }

  public shutdown() {
    const menuOverlay = document.getElementById('menu-dom-overlay');
    if (menuOverlay) menuOverlay.style.display = 'none';
    if (this.input.keyboard) {
      this.input.keyboard.off('keydown');
    }
  }
}

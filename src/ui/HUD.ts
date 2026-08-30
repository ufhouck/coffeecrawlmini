/**
 * Native DOM HUD — iOS Original Style
 * Wooden badge level, green progress bar, score badge, HP hearts
 * Animated banners with slide-in and pulse effects
 */
export class HUD {
  private hudEl: HTMLElement | null;
  private levelLabel: HTMLElement | null;
  private progressBar: HTMLElement | null;
  private progressFill: HTMLElement | null;
  private scoreLabel: HTMLElement | null;
  private hpContainer: HTMLElement | null;
  private discoEl: HTMLElement | null;
  private slowEl: HTMLElement | null;
  private fastEl: HTMLElement | null;

  constructor() {
    this.hudEl = document.getElementById('dom-hud');
    this.levelLabel = document.getElementById('hud-level-label');
    this.progressBar = document.getElementById('hud-progress-bar');
    this.progressFill = document.getElementById('hud-progress-fill');
    this.scoreLabel = document.getElementById('hud-score-label');
    this.hpContainer = document.getElementById('hud-hp-container');
    this.discoEl = document.getElementById('disco-banner');
    this.slowEl = document.getElementById('slow-banner');
    this.fastEl = document.getElementById('fast-banner');
  }

  public setVisible(visible: boolean) {
    if (this.hudEl) {
      this.hudEl.style.display = visible ? 'flex' : 'none';
    }
    if (this.hpContainer) {
      this.hpContainer.style.display = visible ? 'flex' : 'none';
    }
  }

  public updateScore(score: number, _allocation: number, _multiplier: number) {
    if (this.scoreLabel) {
      this.scoreLabel.innerText = score.toLocaleString();
    }
  }

  public updateLevel(level: number, progress: number, target: number) {
    if (this.levelLabel) {
      this.levelLabel.innerText = `LEVEL ${level}`;
    }
    if (this.progressFill && this.progressBar) {
      const pct = Math.min(100, (progress / target) * 100);
      this.progressFill.style.width = `${pct}%`;
    }
  }

  public updateLives(lives: number) {
    if (!this.hpContainer) return;
    this.hpContainer.innerHTML = '';
    
    // HP label
    const hpLabel = document.createElement('span');
    hpLabel.className = 'hp-label';
    hpLabel.innerText = 'HP';
    this.hpContainer.appendChild(hpLabel);

    // Cup icons for lives
    for (let i = 0; i < 3; i++) {
      const cup = document.createElement('img');
      cup.src = './assets/images/logo-cup.png';
      cup.className = 'hp-cup-icon';
      if (i >= lives) {
        cup.style.opacity = '0.2';
        cup.style.filter = 'grayscale(1)';
      }
      this.hpContainer.appendChild(cup);
    }

    // Count badge
    const count = document.createElement('span');
    count.className = 'hp-count';
    count.innerText = `${lives}`;
    this.hpContainer.appendChild(count);
  }

  /** Show/hide banner with CSS slide-in animation */
  private showBanner(el: HTMLElement | null, active: boolean, text?: string) {
    if (!el) return;
    if (active) {
      if (text) el.innerText = text;
      // Force re-trigger animation by removing then adding class
      el.classList.remove('active');
      void el.offsetWidth; // reflow
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  }

  public setDiscoMode(active: boolean, remainingSec = 0) {
    this.showBanner(this.discoEl, active, active ? `DISCO 2X  ${Math.ceil(remainingSec)}s` : undefined);
  }

  public setSlowMode(active: boolean) {
    this.showBanner(this.slowEl, active);
  }

  public setFastMode(active: boolean, remainingSec = 0) {
    this.showBanner(this.fastEl, active, active ? `FAST 1.5X  ${Math.ceil(remainingSec)}s` : undefined);
  }
}

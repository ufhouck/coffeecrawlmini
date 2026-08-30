/**
 * Round Timer + Practice overlay + Allocation beat toasts.
 */
export class RoundTimerUI {
  private timerEl: HTMLElement | null;

  constructor() {
    this.timerEl = document.getElementById('round-timer');
  }

  public update(remainingSeconds: number) {
    if (this.timerEl) {
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      this.timerEl.innerText = `⏱ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      if (remainingSeconds <= 30) {
        this.timerEl.style.color = '#ff4757';
        this.timerEl.style.borderColor = '#ff4757';
        this.timerEl.classList.add('timer-warning');
      } else {
        this.timerEl.style.color = '#ffbe76';
        this.timerEl.style.borderColor = '#c89245';
        this.timerEl.classList.remove('timer-warning');
      }
    }
  }
}

export class PracticeOverlayUI {
  private bannerEl: HTMLElement | null;

  constructor() {
    this.bannerEl = document.getElementById('practice-indicator');
  }

  public setPractice(isPractice: boolean, opensInSec = 0) {
    if (!this.bannerEl) return;

    if (isPractice) {
      this.bannerEl.style.display = 'block';
      this.bannerEl.innerText = `⚠️ PRACTICE (${opensInSec}s)`;
    } else {
      this.bannerEl.style.display = 'none';
    }
  }
}

export class AllocationBeatUI {
  private containerEl: HTMLElement | null;

  constructor() {
    this.containerEl = document.getElementById('allocation-toast-container');
  }

  public triggerBeat(amount: number) {
    if (!this.containerEl) return;

    const toast = document.createElement('div');
    toast.className = 'claim-beat';
    toast.setAttribute('data-gm-allocation-beat', 'true');
    toast.innerHTML = `<img src="./assets/images/honey-bean.png" class="beat-icon" /><span>+$${amount.toFixed(2)}</span>`;

    this.containerEl.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 1200);
  }
}

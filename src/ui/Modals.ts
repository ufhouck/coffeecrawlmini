import type { EconomyState } from '../game/types.ts';
import { roomInstance } from '../room.ts';

/**
 * Game Over & End Screen DOM Modals — Warm coffee palette, receipt card, $BEAN naming.
 */
export class GameOverModalUI {
  private overlayEl: HTMLElement | null;

  constructor() {
    this.overlayEl = document.getElementById('gameover-modal');
  }

  public show(
    score: number,
    allocation: number,
    onRetry: () => void,
    onLobby: () => void
  ) {
    if (!this.overlayEl) return;

    const highScore = parseInt(localStorage.getItem('coffeecrawl_high_score') || '0', 10);
    const isNewHigh = score > highScore;

    this.overlayEl.innerHTML = `
      <div class="modal-card">
        <h2 class="modal-title modal-title-red">${isNewHigh ? '🏆 NEW BEST!' : 'COFFEE SPILLED!'}</h2>
        <div class="modal-stats-card">
          <div class="stat-row">
            <span class="stat-label">Score</span>
            <span class="stat-value stat-gold">${score.toLocaleString()} pts</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Allocation</span>
            <span class="stat-value stat-green">$${allocation.toFixed(2)}</span>
          </div>
          ${isNewHigh ? `<div class="stat-row"><span class="stat-label">Best</span><span class="stat-value stat-gold">${score.toLocaleString()} pts</span></div>` : ''}
        </div>
        <button class="p-btn-green modal-btn-primary" id="gameover-retry">RUN AGAIN</button>
        <button class="p-btn-brown modal-btn-secondary" id="gameover-lobby">LOBBY</button>
      </div>
    `;

    this.overlayEl.style.display = 'flex';

    document.getElementById('gameover-retry')?.addEventListener('click', () => {
      this.hide();
      onRetry();
    });
    document.getElementById('gameover-lobby')?.addEventListener('click', () => {
      this.hide();
      onLobby();
    });
  }

  public hide() {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
      this.overlayEl.innerHTML = '';
    }
  }
}

export class EndScreenModalUI {
  private overlayEl: HTMLElement | null;

  constructor() {
    this.overlayEl = document.getElementById('endscreen-modal');
  }

  public show(
    finalState: EconomyState,
    onPlayNext: () => void,
    onLobby: () => void
  ) {
    if (!this.overlayEl) return;

    const lb = roomInstance.getLeaderboard();
    const playerEntry = lb.find(e => e.isSelf);
    const rank = playerEntry?.rank ?? '-';
    const totalPlayers = lb.length;
    const beanAmount = (finalState.allocation / 0.0425).toFixed(1);

    this.overlayEl.innerHTML = `
      <div class="modal-card">
        <h2 class="modal-title modal-title-green">ROUND COMPLETE!</h2>
        <div class="modal-stats-card">
          <div class="stat-row">
            <span class="stat-label">Final Score</span>
            <span class="stat-value stat-gold">${finalState.score.toLocaleString()} pts</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Earned</span>
            <span class="stat-value stat-green">$${finalState.allocation.toFixed(2)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Rank</span>
            <span class="stat-value stat-cream">#${rank} of ${totalPlayers}</span>
          </div>
        </div>
        <button class="p-btn-green modal-btn-primary" id="endscreen-claim">CLAIM & BUY $BEAN</button>
        <button class="p-btn-brown modal-btn-secondary" id="endscreen-lobby">LOBBY</button>
      </div>
    `;

    this.overlayEl.style.display = 'flex';

    document.getElementById('endscreen-claim')?.addEventListener('click', async () => {
      const claimBtn = document.getElementById('endscreen-claim');
      if (claimBtn) {
        claimBtn.classList.add('claimed');
        claimBtn.innerHTML = '';

        // Animated receipt card
        const receipt = document.createElement('div');
        receipt.className = 'claim-receipt';
        receipt.innerHTML = `
          <img src="./assets/images/honey-bean.png" class="receipt-icon spinning" />
          <div class="receipt-amount">${beanAmount} $BEAN</div>
          <div class="receipt-alloc">$${finalState.allocation.toFixed(2)} Allocation Earned</div>
        `;

        claimBtn.parentElement?.insertBefore(receipt, claimBtn);
        claimBtn.remove();

        // Replace with Play Next Round
        setTimeout(() => {
          receipt.classList.add('receipt-done');
          const nextBtn = document.createElement('button');
          nextBtn.className = 'p-btn-green modal-btn-primary';
          nextBtn.innerText = 'PLAY NEXT ROUND';
          nextBtn.addEventListener('click', () => {
            this.hide();
            onPlayNext();
          });
          receipt.parentElement?.insertBefore(nextBtn, receipt.nextSibling);
        }, 1800);
      }

      await roomInstance.buyToken(finalState.allocation);
    });

    document.getElementById('endscreen-lobby')?.addEventListener('click', () => {
      this.hide();
      onLobby();
    });
  }

  public hide() {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
      this.overlayEl.innerHTML = '';
    }
  }
}

/**
 * Tutorial Modal — 3-card flow.
 */
export class TutorialModalUI {
  private overlayEl: HTMLElement | null;

  constructor() {
    this.overlayEl = document.getElementById('tutorial-modal');
  }

  public show(onClose: () => void) {
    if (!this.overlayEl) return;

    const cards = [
      { title: 'SWIPE TO MOVE', body: 'Tap left/right or use A/D keys to switch between 3 lanes.', icon: './assets/images/logo-cup.png' },
      { title: 'COLLECT BEANS', body: 'Grab coffee beans, sugar, gold beans, and croissants for points! Avoid spills and broken cups.', icon: './assets/images/cekirdek-normal.png' },
      { title: 'EARN $BEAN', body: 'Score points to earn allocation. Claim your $BEAN tokens after each round!', icon: './assets/images/honey-bean.png' }
    ];

    let current = 0;
    const render = () => {
      if (!this.overlayEl) return;
      const card = cards[current];
      const isLast = current === cards.length - 1;

      this.overlayEl.innerHTML = `
        <div class="modal-card tutorial-card">
          <div class="tutorial-icon-wrap">
            <img src="${card.icon}" class="tutorial-img-icon" alt="${card.title}" />
          </div>
          <h2 class="modal-title modal-title-gold">${card.title}</h2>
          <p class="tutorial-body">${card.body}</p>
          <div class="tutorial-dots">
            ${cards.map((_, i) => `<span class="dot ${i === current ? 'active' : ''}"></span>`).join('')}
          </div>
          <button class="p-btn-green modal-btn-primary" id="tutorial-next">${isLast ? 'START!' : 'NEXT'}</button>
        </div>
      `;

      document.getElementById('tutorial-next')?.addEventListener('click', () => {
        if (isLast) {
          this.hide();
          onClose();
        } else {
          current++;
          render();
        }
      });
    };

    this.overlayEl.style.display = 'flex';
    render();
  }

  public hide() {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
      this.overlayEl.innerHTML = '';
    }
  }
}

import type { LeaderboardEntry } from '../game/types.ts';

export class LeaderboardModalUI {
  private overlayEl: HTMLElement | null;

  constructor() {
    this.overlayEl = document.getElementById('leaderboard-modal');
  }

  public show(entries: LeaderboardEntry[], onClose: () => void) {
    if (!this.overlayEl) return;

    const rows = entries.map(e => {
      const selfClass = e.isSelf ? 'lb-self' : '';
      const rankIcon = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`;
      return `
        <tr class="lb-row ${selfClass}">
          <td class="lb-rank">${rankIcon}</td>
          <td class="lb-name">${e.name}</td>
          <td class="lb-score">${e.score.toLocaleString()}</td>
          <td class="lb-alloc">$${e.allocation.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    this.overlayEl.innerHTML = `
      <div class="modal-card lb-card">
        <h2 class="modal-title modal-title-gold">LEADERBOARD</h2>
        <table class="lb-table" data-gm-leaderboard="true">
          <thead>
            <tr>
              <th></th>
              <th>Barista</th>
              <th>Score</th>
              <th>$BEAN</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <button class="p-btn-brown modal-btn-secondary" id="lb-close">CLOSE</button>
      </div>
    `;

    this.overlayEl.style.display = 'flex';

    document.getElementById('lb-close')?.addEventListener('click', () => {
      this.hide();
      onClose();
    });
  }

  public hide() {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
      this.overlayEl.innerHTML = '';
    }
  }
}

import { roomInstance } from '../room.ts';
import { audioManager } from '../systems/AudioManager.ts';

/**
 * CoinPanel — Flaunch-required `data-gm-coin-panel` bar.
 * Connects Flaunch BUY token contract and provides rich in-game feedback.
 */
export class CoinPanelUI {
  private panelEl: HTMLElement | null;

  constructor() {
    this.panelEl = document.getElementById('flaunch-coin-panel');
    this.setupBuyButton();
  }

  public updateAllocation(allocation: number) {
    const allocEl = document.getElementById('coin-panel-allocation');
    if (allocEl) {
      allocEl.innerText = `$${allocation.toFixed(2)}`;
    }
  }

  public show() {
    if (this.panelEl) this.panelEl.style.display = 'flex';
  }

  public hide() {
    if (this.panelEl) this.panelEl.style.display = 'none';
  }

  public destroy() {
    this.hide();
  }

  private showToast(message: string, isSuccess = true) {
    const container = document.getElementById('allocation-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'claim-beat';
    toast.style.color = isSuccess ? '#2ecc71' : '#f5c542';
    toast.style.fontSize = '12px';
    toast.style.background = 'rgba(26, 13, 6, 0.95)';
    toast.style.border = `1px solid ${isSuccess ? '#2ecc71' : '#c89245'}`;
    toast.style.borderRadius = '12px';
    toast.style.padding = '5px 14px';
    toast.style.margin = '4px 0';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.6)';
    toast.innerText = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2200);
  }

  public setupBuyButton(onBuy?: () => void) {
    const buyBtn = document.getElementById('coin-panel-buy-btn');
    if (buyBtn) {
      buyBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const alloc = roomInstance.getState().allocation;
        if (alloc > 0) {
          audioManager.playCollect(true);
          await roomInstance.buyToken(alloc);

          // Flaunch Iframe / Parent PostMessage Contract
          if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'FLAUNCH_BUY',
              action: 'buy_allocation',
              amount: alloc,
              ticker: '$BEAN'
            }, '*');
          }

          this.showToast(`Claimed $${alloc.toFixed(2)} $BEAN Allocation!`, true);
          if (onBuy) onBuy();
        } else {
          audioManager.playHit();
          this.showToast('Collect coffee beans during run to earn allocation!', false);
        }
      };
    }
  }
}

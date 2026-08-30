import { roomInstance } from '../room.ts';
import { audioManager } from '../systems/AudioManager.ts';

/**
 * CoinPanel — Flaunch-required `data-gm-coin-panel` bar.
 * All token references are dynamic via room.getTicker().
 */
export class CoinPanelUI {
  private panelEl: HTMLElement | null;

  constructor() {
    this.panelEl = document.getElementById('flaunch-coin-panel');
    this.setupBuyButton();
    this.syncTicker();
  }

  /** Populate ticker, price, change from room market data */
  public syncTicker() {
    const market = roomInstance.getMarketData();
    const ticker = market.ticker;

    const tickerEl = document.getElementById('coin-panel-ticker');
    if (tickerEl) tickerEl.innerText = ticker;

    const priceEl = document.getElementById('coin-panel-price');
    if (priceEl) priceEl.innerText = market.price > 0 ? `$${market.price.toFixed(4)}` : '--';

    const changeEl = document.getElementById('coin-panel-change');
    if (changeEl) {
      if (market.change24h !== 0) {
        const sign = market.change24h > 0 ? '+' : '';
        changeEl.innerText = `${sign}${market.change24h.toFixed(1)}%`;
        changeEl.style.color = market.change24h >= 0 ? '#2ecc71' : '#ff6b6b';
      } else {
        changeEl.innerText = '';
      }
    }

    const buyBtn = document.getElementById('coin-panel-buy-btn');
    if (buyBtn) buyBtn.innerText = `BUY ${ticker}`;
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

        const ticker = roomInstance.getTicker();
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
              ticker
            }, '*');
          }

          this.showToast(`Claimed $${alloc.toFixed(2)} ${ticker} Allocation!`, true);
          if (onBuy) onBuy();
        } else {
          audioManager.playHit();
          this.showToast('Collect coffee beans during run to earn allocation!', false);
        }
      };
    }
  }
}

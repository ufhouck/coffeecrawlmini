import { roomInstance } from '../room.ts';

/**
 * CoinPanel — Flaunch-required `data-gm-coin-panel` bar.
 * Now uses $BEAN + honey-bean.png icon. Has show/hide/destroy for proper lifecycle.
 */
export class CoinPanelUI {
  private panelEl: HTMLElement | null;

  constructor() {
    this.panelEl = document.getElementById('flaunch-coin-panel');
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

  public setupBuyButton(onBuy?: () => void) {
    const buyBtn = document.getElementById('coin-panel-buy-btn');
    if (buyBtn) {
      buyBtn.onclick = async () => {
        const alloc = roomInstance.getState().allocation;
        if (alloc > 0) {
          await roomInstance.buyToken(alloc);
          if (onBuy) onBuy();
        }
      };
    }
  }
}

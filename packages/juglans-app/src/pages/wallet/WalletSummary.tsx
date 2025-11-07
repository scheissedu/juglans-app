import { Component, Show, onMount, onCleanup } from 'solid-js';
import { AccountInfo } from '@klinecharts/pro';
import KLineChartLight from '@klinecharts/light';
import type { ChartProLight } from '@klinecharts/light';
import AssetHistoryDatafeed from './AssetHistoryDatafeed';
import './Wallet.css';
import './WalletSummary.css'; // New CSS file for this component

const datafeed = new AssetHistoryDatafeed();

const WalletSummary: Component<{ accountInfo: AccountInfo | null }> = (props) => {
  let chartContainer: HTMLDivElement | undefined;
  let chartInstance: ChartProLight | null = null;
  
  const totalBalance = () => props.accountInfo?.equity ?? 0;
  const dailyChange = () => (props.accountInfo?.equity ?? 0) - (props.accountInfo?.balance ?? 0);
  const dailyChangePercent = () => (props.accountInfo?.balance ?? 0) === 0 ? 0 : (dailyChange() / props.accountInfo!.balance) * 100;

  onMount(() => {
    if (chartContainer) {
      chartInstance = new KLineChartLight({
        container: chartContainer,
        symbol: 'ASSET_HISTORY',
        period: { multiplier: 1, timespan: 'day', text: '1D' },
        datafeed: datafeed,
      });
    }
  });

  onCleanup(() => {
    chartInstance?.destroy();
  });

  return (
    <div class="wallet-summary-container">
      <div class="summary-info">
        <div class="summary-label">
          <span>总资产估值</span>
          <span class="currency-selector">USDT ▾</span>
        </div>
        <Show when={props.accountInfo} fallback={<div class="summary-balance">$0.00</div>}>
          <div class="summary-balance">
            ${totalBalance().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div class={`summary-change ${dailyChange() >= 0 ? 'up' : 'down'}`}>
            {dailyChange() >= 0 ? '+' : ''}${dailyChange().toFixed(2)} ({dailyChangePercent().toFixed(2)}%) 今日
          </div>
        </Show>
      </div>
      <div class="summary-chart" ref={chartContainer} />
    </div>
  );
};

export default WalletSummary;
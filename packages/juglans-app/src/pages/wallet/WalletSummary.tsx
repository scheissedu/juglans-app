// packages/juglans-app/src/pages/wallet/WalletSummary.tsx
import { Component, Show, createSignal, For } from 'solid-js';
import { AccountInfo } from '@klinecharts/pro';
// 导入新组件
import { KLineChartTimeSpan } from '@klinecharts/light';
import AssetHistoryDatafeed from './AssetHistoryDatafeed';
import './Wallet.css';
import './WalletSummary.css';

const datafeed = new AssetHistoryDatafeed();
const RANGES = ['1D', '1W', '1M', '1Y'];

const WalletSummary: Component<{ accountInfo: AccountInfo | null }> = (props) => {
  const [activeRange, setActiveRange] = createSignal('1D');
  
  const totalBalance = () => props.accountInfo?.equity ?? 0;
  const dailyChange = () => (props.accountInfo?.equity ?? 0) - (props.accountInfo?.balance ?? 0);
  const dailyChangePercent = () => (props.accountInfo?.balance ?? 0) === 0 ? 0 : (dailyChange() / props.accountInfo!.balance) * 100;

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
      
      <div class="summary-range-selector">
        <For each={RANGES}>
          {(range) => (
            <button
              class="range-btn"
              classList={{ active: activeRange() === range }}
              onClick={() => setActiveRange(range)}
            >
              {range}
            </button>
          )}
        </For>
      </div>

      {/* --- 核心修改：使用 KLineChartTimeSpan --- */}
      {/* 我们只需要给一个定高的容器，组件会自动填满 */}
      <div class="summary-chart">
        <KLineChartTimeSpan
          container="" // 组件内部会使用 ref，这里传空字符串即可（或者修改类型定义让它可选）
          symbol="ASSET_HISTORY"
          period={{ text: activeRange(), multiplier: 1, timespan: 'day' }} // 构造完整的 Period 对象
          datafeed={datafeed}
        />
      </div>
    </div>
  );
};

export default WalletSummary;
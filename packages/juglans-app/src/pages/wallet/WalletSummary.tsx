import { Component, Show } from 'solid-js';
import { AccountInfo } from '@klinecharts/pro';
import './Wallet.css';

interface WalletSummaryProps {
  accountInfo: AccountInfo | null;
}

const WalletSummary: Component<WalletSummaryProps> = (props) => {
  // 从 props 中获取数据，如果不存在则提供默认值
  const totalBalance = () => props.accountInfo?.equity ?? 0;
  const dailyChange = () => (props.accountInfo?.equity ?? 0) - (props.accountInfo?.balance ?? 0); // 使用 equity 和 balance 的差值模拟每日变化
  const dailyChangePercent = () => (props.accountInfo?.balance ?? 0) === 0 ? 0 : (dailyChange() / props.accountInfo!.balance) * 100;

  return (
    <div class="wallet-summary-card">
      <div class="wallet-summary-label">Total Balance</div>
      <Show when={props.accountInfo} fallback={<div class="wallet-summary-balance">$0.00</div>}>
        <div class="wallet-summary-balance">
          ${totalBalance().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div class={`wallet-summary-change ${dailyChange() >= 0 ? 'up' : 'down'}`}>
          {dailyChange() >= 0 ? '+' : ''}${dailyChange().toFixed(2)} ({dailyChangePercent().toFixed(2)}%) Today
        </div>
      </Show>
    </div>
  );
};

export default WalletSummary;
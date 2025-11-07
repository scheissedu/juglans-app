// packages/juglans-app/src/components/chat/cards/BalanceCard.tsx

import { Component, createMemo, Show, createSignal } from 'solid-js';
import type { AssetBalance } from '@klinecharts/pro';
import { KLineChartPro } from '@klinecharts/pro';
import { useAppContext } from '../../../context/AppContext';
import WalletCardIcon from './icons/WalletCardIcon';
import BalanceModal from '../../modals/BalanceModal'; // 导入新的 Modal
import './BalanceCard.css';

interface BalanceData {
  symbol: string;
  balance: AssetBalance;
}

const BalanceCard: Component<{
  node: { attrs: { data: string } };
  deleteNode?: () => void;
}> = (props) => {
  const [modalVisible, setModalVisible] = createSignal(false);
  const [state] = useAppContext();

  const currentTheme = createMemo(() => {
    const chart = state.chart;
    if (chart instanceof KLineChartPro) {
      return chart.getTheme() as 'light' | 'dark';
    }
    return 'dark';
  });

  const balances = createMemo((): BalanceData[] => {
    try {
      const parsedData = JSON.parse(props.node.attrs.data) as Record<string, AssetBalance>;
      return Object.entries(parsedData)
        .map(([symbol, balance]) => ({ symbol, balance }))
        .sort((a, b) => b.balance.total - a.balance.total);
    } catch (e) {
      console.error("Failed to parse balance data for card:", e);
      return [];
    }
  });

  const summaryText = createMemo(() => {
    const topBalances = balances().slice(0, 3);
    if (topBalances.length === 0) return "No assets in wallet.";
    return topBalances.map(b => `${b.symbol}: ${b.balance.total.toFixed(4)}`).join(', ') + (balances().length > 3 ? '...' : '');
  });

  const openModal = (e: MouseEvent) => {
    e.stopPropagation();
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  return (
    <>
      <div class="summary-card-wrapper" onClick={openModal}>
        <div class="summary-card summary-view">
          <div class="card-header">
            <span class="header-title"><WalletCardIcon /> Wallet Balance</span>
            <Show when={props.deleteNode}>
              <button class="card-remove-btn" onClick={(e) => { e.stopPropagation(); props.deleteNode?.(); }}>×</button>
            </Show>
          </div>
          <div class="summary-content">
            {summaryText()}
          </div>
        </div>
      </div>
      
      <Show when={modalVisible()}>
        <BalanceModal
          balances={balances()}
          theme={currentTheme()}
          onClose={closeModal}
        />
      </Show>
    </>
  );
};

export default BalanceCard;
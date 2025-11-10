// packages/juglans-app/src/components/chat/cards-p/BalanceCard/BalanceSummaryView.tsx
import { Component, createMemo, Show, createSignal } from 'solid-js';
import { CardComponentProps } from '../types';
import { BalanceCardData } from './types';
import WalletCardIcon from '@/components/icons/WalletCardIcon'; // Corrected import path
import '../styles/SummaryCard.css';
import BalanceModal from './BalanceModal';

const BalanceSummaryView: Component<CardComponentProps<BalanceCardData>> = (props) => {
  const [modalVisible, setModalVisible] = createSignal(false);
  const openModal = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-remove-btn')) return;
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const balances = createMemo(() => {
    try {
      const parsedData = props.node.attrs.data;
      return Object.entries(parsedData)
        .map(([symbol, balance]) => ({ symbol, balance }))
        .sort((a, b) => b.balance.total - a.balance.total);
    } catch (e) {
      return [];
    }
  });

  const summaryText = createMemo(() => {
    const topBalances = balances().slice(0, 3);
    if (topBalances.length === 0) return "No assets in wallet.";
    return topBalances.map(b => `${b.symbol}: ${b.balance.total.toFixed(4)}`).join(', ') + (balances().length > 3 ? '...' : '');
  });

  return (
    <>
      <div class="summary-card-wrapper" onClick={openModal}>
        <div class="summary-card">
          <div class="card-header">
            <span class="header-title"><WalletCardIcon /> Wallet Balance</span>
            <Show when={props.deleteNode}>
              <button
                class="card-remove-btn"
                onClick={(e) => { e.stopPropagation(); props.deleteNode?.(); }}
              >
                ×
              </button>
            </Show>
          </div>
          <div class="summary-content">
            {summaryText()}
          </div>
        </div>
      </div>
      
      <Show when={modalVisible()}>
        <BalanceModal
          data={props.node.attrs.data}
          theme={'dark'}
          onClose={closeModal}
        />
      </Show>
    </>
  );
};

export default BalanceSummaryView;
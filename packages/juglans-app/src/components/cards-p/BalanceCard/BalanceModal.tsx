// packages/juglans-app/src/components/chat/cards-p/BalanceCard/BalanceModal.tsx
import { Component, For, createMemo } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Modal } from '@klinecharts/pro';
import AssetIcon from '@/components/icons/AssetIcon'; // <-- 核心修改: 导入新组件
import { BalanceCardData, BalanceDisplayData } from './types';
import './styles/BalanceModal.css';

interface BalanceModalProps {
  data: BalanceCardData;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const BalanceModal: Component<BalanceModalProps> = (props) => {
  const balances = createMemo((): BalanceDisplayData[] => {
    try {
      return Object.entries(props.data)
        .map(([symbol, balance]) => ({ symbol, balance }))
        .sort((a, b) => b.balance.total - a.balance.total);
    } catch (e) {
      console.error("Failed to parse balance data for modal:", e);
      return [];
    }
  });
  
  return (
    <Portal>
      <Modal
        class="card-details-modal" 
        data-theme={props.theme}
        title="Wallet Balance Details"
        width={420}
        onClose={props.onClose}
      >
        <div class="balance-list">
          <For each={balances()} fallback={<div class="empty-balance">No assets found.</div>}>
            {(item) => (
              <div class="balance-item">
                <div class="asset-info">
                  {/* --- 核心修改: 使用新组件 --- */}
                  <AssetIcon symbol={item.symbol} assetType="crypto" />
                  <span class="asset-symbol">{item.symbol}</span>
                </div>
                <div class="asset-amount">
                  <div class="total-balance">{item.balance.total.toFixed(6)}</div>
                  <div class="free-balance">Available: {item.balance.free.toFixed(6)}</div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Modal>
    </Portal>
  );
};

export default BalanceModal;
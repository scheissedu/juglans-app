// packages/juglans-app/src/components/modals/BalanceModal.tsx

import { Component, For } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Modal } from '@klinecharts/pro';
import CryptoIcon from '../icons/CryptoIcon';
import type { AssetBalance } from '@klinecharts/pro';
import '../chat/cards/BalanceCard.css'; // Reuse styles

interface BalanceData {
  symbol: string;
  balance: AssetBalance;
}

interface BalanceModalProps {
  balances: BalanceData[];
  theme: 'light' | 'dark';
  onClose: () => void;
}

const BalanceModal: Component<BalanceModalProps> = (props) => {
  return (
    <Portal>
      <Modal
        class="chart-preview-modal" 
        data-theme={props.theme}
        title="Wallet Balance Details"
        width={420}
        onClose={props.onClose}
      >
        {/* --- 核心修改：在这里添加 style 属性 --- */}
        <div 
          class="balance-list" 
          style={{ 
            "margin-top": "20px",
            "padding-bottom": "12px", // 增加底部内边距
            "gap": "16px" 
          }}
        >
          <For each={props.balances} fallback={<div class="empty-balance">No assets found.</div>}>
            {(item) => (
              <div class="balance-item">
                <div class="asset-info">
                  <CryptoIcon symbol={item.symbol} />
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
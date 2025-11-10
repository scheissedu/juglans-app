// packages/juglans-app/src/components/chat/cards/TradeSuggestionCard/TradeConfirmModal.tsx
import { Component, Show } from 'solid-js';
import { Modal } from '@klinecharts/pro';

interface TradeConfirmModalProps {
  tradeDetails: {
    symbol: string;
    direction: 'LONG' | 'SHORT';
    leverage?: number;
    entry_price?: number;
    stop_loss?: number;
    take_profit?: any[];
    position_size_usd?: number;
  };
  theme: 'light' | 'dark';
  onClose: () => void;
  onConfirm: () => void;
}

const TradeConfirmModal: Component<TradeConfirmModalProps> = (props) => {
  return (
    <Modal
      class="card-details-modal" 
      data-theme={props.theme}
      title="Confirm Trade"
      width={420}
      onClose={props.onClose}
      buttons={[
        { type: 'cancel', children: 'Cancel', onClick: props.onClose },
        { type: 'confirm', children: 'Confirm', onClick: props.onConfirm }
      ]}
    >
      <Show when={props.tradeDetails} keyed>
        {trade => (
          <div class="trade-confirm-content">
            <p>Please confirm the details of your trade:</p>
            <ul>
              <li><strong>Symbol:</strong> {trade.symbol}</li>
              <li><strong>Direction:</strong> <span class={trade.direction === 'LONG' ? 'long' : 'short'}>{trade.direction}</span></li>
              <li><strong>Size:</strong> {trade.position_size_usd} USD</li>
              {/* ... other details ... */}
            </ul>
            <div class="trade-confirm-warning">
              Trading involves significant risk. This is a suggestion and not financial advice.
            </div>
          </div>
        )}
      </Show>
    </Modal>
  );
};

export default TradeConfirmModal;
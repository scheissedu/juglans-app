// /klinecharts-workspace/packages/preview/src/TradeConfirmModal.tsx

import { Component, Show } from 'solid-js';
import { Modal } from '@klinecharts/pro';
import type { TradeSuggestion } from '@klinecharts/pro';
import { useChartPro } from './ChartProContext';

interface TradeConfirmModalProps {
  tradeDetails: Partial<TradeSuggestion['trade_suggestion']> & { symbol: string };
  onClose: () => void;
  onConfirm: () => void;
}

const TradeConfirmModal: Component<TradeConfirmModalProps> = (props) => {
  const { chart: chartProInstance } = useChartPro();
  const currentTheme = () => chartProInstance()?.getTheme() ?? 'light';

  return (
    <Modal
      class="chart-preview-modal" 
      data-theme={currentTheme()}
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
              <li><strong>Leverage:</strong> {trade.leverage}x</li>
              <li><strong>Entry Price:</strong> ~{trade.entry_price?.toFixed(2)}</li>
              <li><strong>Stop Loss:</strong> {trade.stop_loss?.toFixed(2)}</li>
              <Show when={trade.take_profit && trade.take_profit[0]}>
                <li><strong>Take Profit 1:</strong> {trade.take_profit[0].price.toFixed(2)}</li>
              </Show>
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
// packages/juglans-app/src/components/chat/cards-p/PositionCard/PositionSummaryView.tsx
import { Component, createMemo, Show, createSignal } from 'solid-js';
import { CardComponentProps } from '../types';
import { PositionCardData } from './types';
import PositionCardIcon from '@/components/icons/PositionCardIcon'; // Corrected import path
import '../styles/SummaryCard.css';
import PositionModal from './PositionModal';

const PositionSummaryView: Component<CardComponentProps<PositionCardData>> = (props) => {
  const [modalVisible, setModalVisible] = createSignal(false);
  const openModal = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-remove-btn')) return;
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const positions = createMemo(() => props.node.attrs.data || []);

  const summaryText = createMemo(() => {
    const data = positions();
    if (data.length === 0) return 'No open positions';
    const longCount = data.filter(p => p.side === 'long').length;
    const shortCount = data.filter(p => p.side === 'short').length;
    return `${data.length} open positions: ${longCount} long, ${shortCount} short.`;
  });

  return (
    <>
      <div class="summary-card-wrapper" onClick={openModal}>
        <div class="summary-card">
            <div class="card-header">
              <span class="header-title"><PositionCardIcon /> My Positions</span>
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
        <PositionModal
          data={props.node.attrs.data}
          theme={'dark'}
          onClose={closeModal}
        />
      </Show>
    </>
  );
};

export default PositionSummaryView;
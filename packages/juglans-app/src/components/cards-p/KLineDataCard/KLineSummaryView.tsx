// packages/juglans-app/src/components/chat/cards-p/KLineDataCard/KLineSummaryView.tsx
import { Component, createMemo, Show, createSignal } from 'solid-js';
import { CardComponentProps } from '../types';
import { KLineDataCardData } from './types';
import '../styles/SummaryCard.css';
import KLineModal from './KLineModal'; // Import the modal

const KLineSummaryView: Component<CardComponentProps<KLineDataCardData>> = (props) => {
  // --- CORE FIX: Re-introduce self-managed modal state ---
  const [modalVisible, setModalVisible] = createSignal(false);
  const openModal = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-remove-btn')) return;
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const klineData = createMemo(() => props.node.attrs.data.data || []);

  const summary = createMemo(() => {
    const data = klineData();
    if (data.length === 0) return 'No data';
    const high = Math.max(...data.map(d => d.high));
    const low = Math.min(...data.map(d => d.low));
    const volume = data.reduce((sum, d) => sum + (d.volume ?? 0), 0);
    return `Bars: ${data.length}, High: ${high.toFixed(2)}, Low: ${low.toFixed(2)}, Vol: ${(volume / 1000).toFixed(2)}k`;
  });

  return (
    <>
      {/* --- CORE FIX: Add onClick handler back to the wrapper --- */}
      <div class="summary-card-wrapper" onClick={openModal}>
        <div class="summary-card">
          <div class="card-header">
            <span class="header-title">
              📈 {`${props.node.attrs.data.symbol} - ${props.node.attrs.data.period}`}
            </span>
            <Show when={props.deleteNode}>
              <button
                class="card-remove-btn"
                onClick={(e) => { e.stopPropagation(); props.deleteNode?.(); }}
              >
                ×
              </button>
            </Show>
          </div>
          <div class="summary-content">{summary()}</div>
        </div>
      </div>

      {/* --- CORE FIX: Render the modal based on local state --- */}
      <Show when={modalVisible()}>
        <KLineModal
          data={props.node.attrs.data}
          theme={'dark'}
          onClose={closeModal}
        />
      </Show>
    </>
  );
};

export default KLineSummaryView;
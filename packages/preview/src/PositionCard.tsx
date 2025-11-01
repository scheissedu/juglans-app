// /klinecharts-workspace/packages/preview/src/PositionCard.tsx

import { Component, createMemo, Show, createSignal } from 'solid-js';
import type { Position } from '@klinecharts/pro';
import PositionModal from './PositionModal'; // 我们将创建这个文件

// 内部组件，负责渲染卡片内容
const CardContent: Component<{
  summary: string;
  deleteNode?: () => void;
  onClick: () => void;
}> = (props) => (
  <div class="card-inner-content" onClick={props.onClick}>
    <div class="card-header">
      <span>📊 My Positions</span>
      <Show when={props.deleteNode}>
        <button
          class="card-remove-btn"
          onClick={(e) => { e.stopPropagation(); props.deleteNode?.(); }}
        >
          ×
        </button>
      </Show>
    </div>
    <div class="card-summary">
      {props.summary}
    </div>
  </div>
);

const PositionCard: Component<{
  node: { attrs: { data: string } };
  deleteNode?: () => void;
}> = (props) => {
  const [modalVisible, setModalVisible] = createSignal(false);
  
  const positions = createMemo(() => {
    try {
      return JSON.parse(props.node.attrs.data) as Position[];
    } catch (e) {
      return [];
    }
  });

  const summary = createMemo(() => {
    const data = positions();
    if (data.length === 0) return 'No open positions';
    const longCount = data.filter(p => p.side === 'long').length;
    const shortCount = data.filter(p => p.side === 'short').length;
    return `${data.length} open positions: ${longCount} long, ${shortCount} short.`;
  });

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <>
      <div class="kline-data-card"> {/* 复用 kline-data-card 的样式 */}
        <CardContent 
          summary={summary()}
          deleteNode={props.deleteNode}
          onClick={openModal}
        />
      </div>

      <Show when={modalVisible()}>
        <PositionModal
          positions={positions()}
          onClose={closeModal}
        />
      </Show>
    </>
  );
};

export default PositionCard;
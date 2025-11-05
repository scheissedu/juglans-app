import { Component, createMemo, Show, createSignal } from 'solid-js';
import type { Position } from '@klinecharts/pro';
import PositionModal from '../../modals/PositionModal';
import { useAppContext } from '../../../context/AppContext'; // 1. 导入 useAppContext
import { KLineChartPro } from '@klinecharts/pro'; // 2. 导入 KLineChartPro 用于类型检查
import './KLineDataCard.css';

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
  const [state] = useAppContext(); // 3. 获取全局 state

  // 4. 新增 memo 来获取主题
  const currentTheme = createMemo(() => {
    const chart = state.chart;
    if (chart instanceof KLineChartPro) {
      return chart.getTheme() as 'light' | 'dark';
    }
    return 'dark'; // 默认主题
  });
  
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
      <div class="kline-data-card">
        <CardContent 
          summary={summary()}
          deleteNode={props.deleteNode}
          onClick={openModal}
        />
      </div>

      <Show when={modalVisible()}>
        <PositionModal
          positions={positions()}
          theme={currentTheme()} // 5. 将主题作为 prop 传递
          onClose={closeModal}
        />
      </Show>
    </>
  );
};

export default PositionCard;
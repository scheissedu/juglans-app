import { Component, createMemo, Show, createSignal } from 'solid-js';
import type { Position } from '@klinecharts/pro';
import PositionModal from '../../modals/PositionModal';
import { useAppContext } from '../../../context/AppContext';
import { KLineChartPro } from '@klinecharts/pro';
import PositionCardIcon from './icons/PositionCardIcon'; // 导入新图标
import './KLineDataCard.css'; // 复用部分样式
import './BalanceCard.css'; // 复用新的卡片样式

const PositionCard: Component<{
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
  
  const positions = createMemo((): Position[] => {
    try {
      return JSON.parse(props.node.attrs.data) as Position[];
    } catch (e) {
      return [];
    }
  });

  const summaryText = createMemo(() => {
    const data = positions();
    if (data.length === 0) return 'No open positions';
    const longCount = data.filter(p => p.side === 'long').length;
    const shortCount = data.filter(p => p.side === 'short').length;
    return `${data.length} open positions: ${longCount} long, ${shortCount} short.`;
  });

  const openModal = (e: MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到父div，避免切换展开状态
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  return (
    <>
      <div class="summary-card-wrapper" onClick={openModal}>
        <div class="summary-card summary-view">
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
          positions={positions()}
          theme={currentTheme()}
          onClose={closeModal}
        />
      </Show>
    </>
  );
};

export default PositionCard;
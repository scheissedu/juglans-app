import { Component, createMemo, Show, createSignal } from 'solid-js';
import type { KLineData } from '@klinecharts/core';
import { NodeViewWrapper } from 'tiptap-solid';
import ChartModal from '../../modals/ChartModal';
import { useAppContext } from '../../../context/AppContext';
import { KLineChartPro, type ChartPro } from '@klinecharts/pro';
import './KLineDataCard.css';

const CardContent: Component<{
  symbol: string;
  period: string;
  summary: string;
  deleteNode?: () => void;
  onClick: () => void;
}> = (props) => (
  <div class="card-inner-content" onClick={props.onClick}>
    <div class="card-header">
      <span>{`${props.symbol} - ${props.period}`}</span>
      <Show when={props.deleteNode}>
        <button class="card-remove-btn" onClick={(e) => { e.stopPropagation(); props.deleteNode?.(); }}>×</button>
      </Show>
    </div>
    <div class="card-summary">{props.summary}</div>
  </div>
);

const KLineDataCard: Component<{
  node: { attrs: { symbol: string, period: string, data: string } };
  deleteNode?: () => void;
}> = (props) => {
  const [modalVisible, setModalVisible] = createSignal(false);
  const [state] = useAppContext();

  const currentTheme = createMemo(() => {
    const chart = state.chart;
    if (chart && chart instanceof KLineChartPro) {
      return chart.getTheme();
    }
    return 'dark';
  });
  
  const klineData = createMemo(() => {
    try {
      return JSON.parse(props.node.attrs.data) as KLineData[];
    } catch (e) {
      return [];
    }
  });

  const summary = createMemo(() => {
    const data = klineData();
    if (data.length === 0) return 'No data';
    const high = Math.max(...data.map(d => d.high));
    const low = Math.min(...data.map(d => d.low));
    const volume = data.reduce((sum, d) => sum + (d.volume ?? 0), 0);
    return `Bars: ${data.length}, High: ${high.toFixed(2)}, Low: ${low.toFixed(2)}, Vol: ${(volume / 1000).toFixed(2)}k`;
  });

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <>
      <Show
        when={props.deleteNode}
        fallback={
          <NodeViewWrapper class="kline-data-card">
            <CardContent 
              symbol={props.node.attrs.symbol} period={props.node.attrs.period}
              summary={summary()} onClick={openModal}
            />
          </NodeViewWrapper>
        }
      >
        <div class="kline-data-card">
          <CardContent 
            symbol={props.node.attrs.symbol} period={props.node.attrs.period}
            summary={summary()} deleteNode={props.deleteNode} onClick={openModal}
          />
        </div>
      </Show>

      <Show when={modalVisible()}>
        <ChartModal
          symbol={props.node.attrs.symbol}
          period={props.node.attrs.period}
          data={klineData()}
          theme={currentTheme()}
          onClose={closeModal}
        />
      </Show>
    </>
  );
};

export default KLineDataCard;
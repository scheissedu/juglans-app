// /klinecharts-workspace/packages/preview/src/ChartModal.tsx

import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Modal } from '@klinecharts/pro';
import { init, dispose } from '@klinecharts/core';
import type { KLineData } from '@klinecharts/core';
import { useChartPro } from './ChartProContext'; // 导入 useChartPro 以获取主题

interface ChartModalProps {
  symbol: string;
  period: string;
  data: KLineData[];
  onClose: () => void;
}

const ChartModal: Component<ChartModalProps> = (props) => {
  let chartContainer: HTMLDivElement | undefined;
  const { chart: chartProInstance } = useChartPro(); // 获取 pro 实例

  // 获取当前的主题
  const currentTheme = () => chartProInstance()?.getTheme() ?? 'light';

  onMount(() => {
    if (chartContainer) {
      const chart = init(chartContainer, {
        styles: currentTheme(), // 根据当前主题初始化图表样式
        zoomEnabled: false,
        scrollEnabled: false,
      });
      chart?.applyNewData(props.data);
      
      onCleanup(() => {
        dispose(chartContainer!);
      });
    }
  });

  return (
    <Portal>
      {/* --- 关键修改：添加 data-theme 属性 --- */}
      <Modal
        class="chart-preview-modal" 
        data-theme={currentTheme()} // 将主题信息传递到 DOM
        title={`${props.symbol} - ${props.period}`}
        width={800}
        onClose={props.onClose}
      >
        <div style={{ height: '450px', 'margin-top': '20px' }}>
          <div ref={chartContainer} style={{ width: '100%', height: '100%' }} />
        </div>
      </Modal>
    </Portal>
  );
};

export default ChartModal;
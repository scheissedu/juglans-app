// packages/juglans-app/src/components/modals/ChartModal.tsx

import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Modal } from '@klinecharts/pro';
import { init, dispose, Chart } from '@klinecharts/core';
import type { KLineData } from '@klinecharts/core';

interface ChartModalProps {
  symbol: string;
  period: string;
  data: KLineData[];
  theme: 'light' | 'dark';
  onClose: () => void;
}

const ChartModal: Component<ChartModalProps> = (props) => {
  let chartContainer: HTMLDivElement | undefined;
  let chart: Chart | null = null;

  // --- 关键修正：使用 createEffect 来确保在容器可见后初始化图表 ---
  createEffect(() => {
    // onMount 只能保证 DOM 元素被创建，但不能保证 Modal 已经完成动画并可见。
    // createEffect 会在 props 变化和 DOM 更新后执行。
    // 我们延迟一小段时间（例如 100ms），以确保 Modal 的开场动画完成，容器已经有实际尺寸。
    const timeoutId = setTimeout(() => {
      if (chartContainer && !chart) { // 确保只初始化一次
        console.log('[ChartModal] Initializing chart inside modal...');
        chart = init(chartContainer, {
          styles: props.theme,
          // 预览弹窗中的图表通常不需要交互
          zoomEnabled: false,
          scrollEnabled: false,
        });

        // 检查数据是否存在并应用
        if (props.data && props.data.length > 0) {
          console.log(`[ChartModal] Applying ${props.data.length} data points.`);
          chart?.applyNewData(props.data);
        } else {
          console.warn('[ChartModal] No data provided to the modal chart.');
        }

        // 确保图表尺寸正确
        chart?.resize();
      }
    }, 100); // 延迟 100 毫秒

    onCleanup(() => {
      clearTimeout(timeoutId);
    });
  });


  onCleanup(() => {
    // 组件卸载时销毁图表实例
    if (chartContainer) {
      console.log('[ChartModal] Disposing chart...');
      dispose(chartContainer);
      chart = null;
    }
  });

  return (
    <Portal>
      <Modal
        class="chart-preview-modal" 
        data-theme={props.theme}
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
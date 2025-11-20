// packages/light/src/KLineChartTimeSpan.tsx
import { Component, onCleanup, onMount, mergeProps } from 'solid-js';
import { ActionType, DeepPartial, Styles, Chart } from '@klinecharts/core';
import KLineChartLight from './index';
import { ChartProLightOptions } from './types';

// 继承基础配置，但我们可以通过 props 覆盖样式
interface KLineChartTimeSpanProps extends ChartProLightOptions {
  // 可以添加额外的 props，例如是否显示 tooltip 等
  interactive?: boolean;
}

const KLineChartTimeSpan: Component<KLineChartTimeSpanProps> = (p) => {
  // 默认样式：面积图，隐藏所有轴线和网格，保留 Crosshair 和 Tooltip
  const defaultStyles: DeepPartial<Styles> = {
    grid: { show: false },
    candle: {
      type: 'area',
      area: {
        lineColor: '#BFFF00',
        lineWidth: 2,
        smooth: true,
        backgroundColor: [{
          offset: 0,
          color: 'rgba(191, 255, 0, 0.2)'
        }, {
          offset: 1,
          color: 'rgba(191, 255, 0, 0.0)'
        }]
      },
      tooltip: {
        showRule: 'follow_cross',
        showType: 'standard',
        custom: [
          { title: 'Time', value: '{time}' },
          { title: 'Value', value: '{close}' }
        ],
        text: {
          size: 12,
          family: 'Inter',
          weight: 'bold',
          color: '#A0A0A0',
          marginLeft: 8,
          marginTop: 4
        }
      },
      priceMark: { show: false }
    },
    crosshair: {
      show: true,
      horizontal: { show: false, line: { show: false }, text: { show: false } },
      vertical: {
        show: true,
        line: { show: true, style: 'solid', color: 'rgba(255, 255, 255, 0.2)', size: 1 },
        text: { show: false }
      }
    },
    xAxis: { show: false },
    yAxis: { show: false },
    separator: { show: false },
  };

  // 合并用户传入的样式
  const mergedProps = mergeProps({ styles: defaultStyles, interactive: true }, p);

  let chartContainer: HTMLDivElement | undefined;
  let chartInstance: any | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let initTimer: number | null = null;

  onMount(() => {
    // 初始化逻辑
    const initWrapper = () => {
      if (!chartContainer) return;
      
      // 实例化底层的 KLineChartLight
      // 注意：这里我们不直接使用 KLineChartLight 组件的 JSX 形式，
      // 而是使用它的类形式来获得更直接的控制，或者我们也可以渲染组件。
      // 为了封装方便，这里我们在父级渲染了 KLineChartLight，这里只做逻辑增强。
      // 但由于 KLineChartLight 目前是默认导出类，我们需要稍微调整用法。
      
      // 实际上，为了最佳封装，我们应该在这里实例化 KLineChartLight 类
      chartInstance = new KLineChartLight({
        ...mergedProps,
        container: chartContainer,
        styles: { ...defaultStyles, ...p.styles }, // 深度合并样式
      });

      // --- 核心逻辑：等待图表就绪并锁定视图 ---
      const waitForChartInit = () => {
        const internalChart: Chart | null = chartInstance?.getChart();

        if (internalChart) {
          // 1. 锁定交互
          internalChart.setScrollEnabled(false);
          internalChart.setZoomEnabled(false);
          internalChart.setOffsetRightDistance(0);

          // 2. 适配宽度逻辑
          const fitContent = () => {
            if (!chartContainer || !internalChart) return;
            const width = chartContainer.clientWidth;
            const dataList = internalChart.getDataList();

            if (width > 0 && dataList.length > 0) {
              const space = width / dataList.length;
              internalChart.setBarSpace(space);
              internalChart.scrollToRealTime();
            }
          };

          // 3. 绑定事件
          internalChart.subscribeAction(ActionType.OnDataReady, fitContent);

          let resizeTimeout: number;
          resizeObserver = new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
              internalChart.resize();
              fitContent();
            }, 50);
          });
          resizeObserver.observe(chartContainer);

        } else {
          initTimer = requestAnimationFrame(waitForChartInit);
        }
      };

      initTimer = requestAnimationFrame(waitForChartInit);
    };

    initWrapper();
  });

  onCleanup(() => {
    if (initTimer) cancelAnimationFrame(initTimer);
    resizeObserver?.disconnect();
    chartInstance?.destroy();
  });

  return <div ref={chartContainer} style={{ width: '100%', height: '100%' }} />;
};

export default KLineChartTimeSpan;
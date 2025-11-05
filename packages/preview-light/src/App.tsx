import { Component, onMount, onCleanup } from 'solid-js';
import KLineChartLight from '@klinecharts/light';
import { Period } from '@klinecharts/core';
import OkxDatafeed from '../../preview/src/api/OkxDatafeed'; // 复用 preview 包的 datafeed

const App: Component = () => {
  let chartContainer: HTMLDivElement | undefined;
  let chartInstance: KLineChartLight | null = null;

  onMount(() => {
    if (chartContainer) {
      chartInstance = new KLineChartLight({
        container: chartContainer,
        symbol: 'BTC-USDT', // 直接使用 ticker 字符串
        period: { multiplier: 1, timespan: 'week', text: '1W' },
        datafeed: new OkxDatafeed(),
        onPeriodChange: (period: Period) => {
          console.log(`Period changed to: ${period.text}`);
          // datafeed 会自动处理周期切换，这里可以留空或做其他事情
        },
        periods: [ // 自定义周期
          { multiplier: 1, timespan: 'day', text: '1D' },
          { multiplier: 1, timespan: 'week', text: '1W' },
          { multiplier: 1, timespan: 'month', text: '1M' },
          { multiplier: 1, timespan: 'year', text: '1Y' }
        ]
      });
    }

    onCleanup(() => {
      chartInstance?.destroy();
    });
  });

  return (
    <div
      ref={chartContainer}
      style={{
        width: '600px',
        height: '400px',
        "border-radius": "8px",
        overflow: "hidden"
      }}
    />
  );
};

export default App;
// packages/juglans-app/src/pages/PredictMarketPage.tsx
import { Component, onCleanup, createEffect, Show, createResource } from 'solid-js';
import { useParams } from '@solidjs/router';
import KLineChartLight from '@klinecharts/light';
import type { ChartProLight, Datafeed, Styles, YAxisStyle } from '@klinecharts-light';
import PredictDatafeed from '@/api/datafeed/PredictDatafeed';
import { Loading } from '@klinecharts/pro';

const pageStyles = `
  .predict-market-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px;
    box-sizing: border-box;
    color: #fff;
  }
  .predict-market-header {
    flex-shrink: 0;
    margin-bottom: 20px;
  }
  .predict-market-question {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 12px 0;
  }
  .predict-chart-container {
    flex-grow: 1;
    min-height: 0;
    border-radius: 8px;
    overflow: hidden;
    /* 移除边框，让图表充满容器 */
  }
`;

const baseDatafeed = new PredictDatafeed();

// --- 核心修正 1: 定义图表样式和 Y 轴配置 ---
const customStyles: Styles = {
  // 1. 将图表类型从蜡烛图改为面积图
  candle: {
    type: 'area',
    area: {
      lineColor: '#BFFF00', // 主题色
      lineWidth: 2,
      value: 'close',
      backgroundColor: [{
        offset: 0,
        color: 'rgba(191, 255, 0, 0.2)' // 顶部颜色
      }, {
        offset: 1,
        color: 'rgba(191, 255, 0, 0.0)' // 底部颜色
      }]
    },
  },
  // 2. 隐藏网格线，使其更简洁
  grid: {
    show: false
  },
  // 3. 调整十字线样式
  crosshair: {
    horizontal: {
      line: { show: false }
    }
  },
  // 4. 调整坐标轴样式
  xAxis: {
    tickLine: { show: false },
    tickText: { color: '#A0A0A0' }
  },
  yAxis: {
    tickLine: { show: false },
    tickText: { color: '#A0A0A0' }
  },
  separator: {
    color: 'transparent'
  }
};

const customYAxisOptions: YAxisStyle = {
  // 5. 自定义 Y 轴标签格式
  tickText: {
    formatter: (value: any) => `${(value * 100).toFixed(0)}%`
  }
};


const PredictMarketPage: Component = () => {
  const params = useParams();
  const [marketDetails] = createResource(() => params.slug, baseDatafeed.getMarketDetails);
  const [eventDetails] = createResource(() => marketDetails()?.event_ticker, baseDatafeed.getEventDetails);

  let chartContainer: HTMLDivElement | undefined;
  let chartInstance: ChartProLight | null = null;

  createEffect(() => {
    const market = marketDetails();
    const event = eventDetails();
    
    if (chartContainer && market && event) {
      if (chartInstance) {
        chartInstance.destroy();
      }
      
      setTimeout(() => {
        if (chartContainer) {
            const scopedDatafeed: Datafeed = Object.create(baseDatafeed);
            scopedDatafeed.getHistoryKLineData = (symbol, period, params, onResult, onError) => {
              return baseDatafeed.getHistoryKLineData(symbol, period, params, onResult, onError, event.series_ticker);
            };

            // --- 核心修正 2: 在初始化时传入样式和Y轴配置 ---
            chartInstance = new KLineChartLight({
                container: chartContainer,
                symbol: market.ticker,
                period: { multiplier: 1, timespan: 'hour', text: '1H' },
                datafeed: scopedDatafeed,
                styles: customStyles, // 应用自定义样式
                yAxis: customYAxisOptions, // 应用自定义Y轴配置
            });
        }
      }, 0);
    }
  });

  onCleanup(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
  });

  return (
    <>
      <style>{pageStyles}</style>
      <div class="predict-market-page">
        <Show when={!marketDetails.loading && !eventDetails.loading && marketDetails()} fallback={<Loading />}>
          <div class="predict-market-header">
            <h1 class="predict-market-question">{eventDetails()?.title || marketDetails()!.title || 'Loading market...'}</h1>
          </div>
          
          <div class="predict-chart-container" ref={chartContainer} />
        </Show>
      </div>
    </>
  );
};

export default PredictMarketPage;
// /klinecharts-workspace/packages/preview/src/App.tsx

import { KLineChartPro, Resizer } from '@klinecharts/pro';
import { onMount, Component, createSignal, onCleanup, createEffect, Show } from 'solid-js';
import OkxDatafeed from './OkxDatafeed';
import ChatAreaProvider from './ChatArea';
import ChartProContext from './ChartProContext';
import { MockBrokerAPI } from './MockBrokerAPI';
import { BrokerStateProvider } from '@klinecharts/pro/src/api/BrokerStateContext'; 
import { BrokerProvider } from '@klinecharts/pro/src/api/BrokerAPIContext';

const App: Component = () => {
  let chartContainer: HTMLDivElement | undefined;
  let appRef: HTMLDivElement | undefined;
  const [chartProInstance, setChartProInstance] = createSignal<KLineChartPro | null>(null);
  const [chatVisible, setChatVisible] = createSignal(true);
  const [chatAreaWidth, setChatAreaWidth] = createSignal(320);

  const datafeed = new OkxDatafeed();
  const mockBroker = new MockBrokerAPI();
  
  onMount(() => {
    let locale = 'zh-CN';
    if (window.location.hash.endsWith('#en-US')) {
      locale = 'en-US';
    }
    
    const instance = new KLineChartPro({
      container: chartContainer!,
      locale,
      watermark: '',
      symbol: 'BTC-USDT',
      theme:"dark",
      period: { multiplier: 1, timespan: 'hour', text: '1H' },
      subIndicators: ['VOL', 'MACD'],
      datafeed: datafeed,
      brokerApi: mockBroker,
      onRobotClick: () => setChatVisible(v => !v)
    });
    
    setChartProInstance(instance);
    mockBroker.connect();

    // +++ 核心修正：使用 onCleanup 来处理组件卸载逻辑 +++
    onCleanup(() => {
        mockBroker.unsubscribe();
        mockBroker.disconnect();
        chartProInstance()?.getChart()?.unsubscribeAction('onCrosshairChange');
    });
  });

  createEffect(() => {
      const chart = chartProInstance();
      const theme = chart?.getTheme() ?? 'dark';
      if (appRef) {
          appRef.setAttribute('data-theme', theme);
      }
      chatVisible();
      chatAreaWidth(); 
      setTimeout(() => chart?.getChart()?.resize(), 50);
  });

  const handleVerticalResize = (deltaX: number) => {
    setChatAreaWidth(prev => {
      const newWidth = prev - deltaX;
      return Math.max(280, Math.min(newWidth, 600));
    });
  };

  return (
    <div id="app" ref={appRef}>
      <BrokerProvider value={mockBroker}>
        <BrokerStateProvider>
          <ChartProContext.Provider value={{ chart: chartProInstance, setChart: setChartProInstance }}>
            <div class="main-layout">
              <div class="chart-container" ref={chartContainer} />
              <Show when={chatVisible()}>
                <>
                  <Resizer direction="vertical" onResize={handleVerticalResize} />
                  <div class="chat-area-container" style={{ width: `${chatAreaWidth()}px` }}>
                    <ChatAreaProvider />
                  </div>
                </>
              </Show>
            </div>
          </ChartProContext.Provider>
        </BrokerStateProvider>
      </BrokerProvider>
    </div>
  );
};

export default App;
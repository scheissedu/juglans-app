import { Component, createEffect, on, onCleanup } from 'solid-js';
import { KLineChartPro, dispose } from '@klinecharts/pro';
import KLineChartLight from '@klinecharts/light';
import type { ChartPro } from '@klinecharts/pro';
import type { ChartProLight } from '@klinecharts/light';
import { useAppContext } from '../context/AppContext';
import UnifiedDatafeed from '../api/datafeed/UnifiedDatafeed';

type AnyChart = ChartPro | ChartProLight;

export interface ChartContainerProps {
  mode: 'pro' | 'light';
  onChartReady: (chart: AnyChart | null) => void;
}

const ChartContainer: Component<ChartContainerProps> = (props) => {
  console.log('[ChartContainer.tsx] Component rendering...');

  const [state] = useAppContext();
  let containerRef: HTMLDivElement | undefined;
  let chartInstance: AnyChart | null = null;
  const datafeed = new UnifiedDatafeed();

  createEffect(on(
    () => [props.mode, state.symbol, state.period],
    ([currentMode, currentSymbol, currentPeriod]) => {
      console.log(`[ChartContainer.tsx] Effect triggered. Mode: ${currentMode}, Symbol: ${currentSymbol.ticker}, Period: ${currentPeriod.text}`);
      
      if (!containerRef) {
        console.error("[ChartContainer.tsx] ERROR: Container ref is not available when effect runs.");
        return;
      }
      
      onCleanup(() => {
        if (chartInstance) {
          console.log("[ChartContainer.tsx] Cleanup: Destroying old chart instance...");
          if (chartInstance instanceof KLineChartPro) {
            chartInstance.getChart()?.destroy();
          } else {
            chartInstance.destroy();
          }
          chartInstance = null;
          props.onChartReady(null);
        }
        if(containerRef) {
          containerRef.innerHTML = '';
          console.log("[ChartContainer.tsx] Cleanup: Container cleared.");
        }
      });

      const initTimeout = setTimeout(() => {
        if (!containerRef || containerRef.clientWidth < 10 || containerRef.clientHeight < 10) {
          console.warn(`[ChartContainer.tsx] SKIPPING INIT: Container not ready. Size: ${containerRef?.clientWidth}x${containerRef?.clientHeight}`);
          return;
        }
        
        console.log(`[ChartContainer.tsx] INITIALIZING new chart...`);

        try {
          if (currentMode === 'pro') {
            chartInstance = new KLineChartPro({
              container: containerRef!,
              symbol: currentSymbol,
              period: currentPeriod,
              // ... (rest of the properties are the same)
              datafeed: datafeed,
              brokerApi: state.brokerApi,
              theme: 'dark',
              locale: 'en-US',
              watermark: '<img src="/logo.svg" class="logo" alt="Juglans Logo" />',
              bottomBarVisible: false,
              styles: {
                candle: { bar: { upColor: '#BFFF00', upBorderColor: '#BFFF00', upWickColor: '#BFFF00', downColor: '#F92855', downBorderColor: '#F92855', downWickColor: '#F92855' }, priceMark: { high: { color: '#A0A0A0' }, low: { color: '#A0A0A0' }, last: { upColor: '#BFFF00', downColor: '#F92855', text: { upColor: '#121212', downColor: '#FFFFFF' } } } },
                indicator: { ohlc: { upColor: 'rgba(191, 255, 0, 0.7)', downColor: 'rgba(249, 40, 85, 0.7)' }, bars: [{ upColor: 'rgba(191, 255, 0, 0.7)', downColor: 'rgba(249, 40, 85, 0.7)' }], lines: [{ color: '#A0A0A0' }, { color: '#D4D4D4' }, { color: '#FFFFFF' }] },
                crosshair: { horizontal: { line: { color: '#A0A0A0' }, text: { borderColor: '#A0A0A0', backgroundColor: '#A0A0A0', color: '#121212'}}, vertical: { line: { color: '#A0A0A0' }, text: { borderColor: '#A0A0A0', backgroundColor: '#A0A0A0', color: '#121212'}}, },
                overlay: { point: { color: '#BFFF00', borderColor: 'rgba(191, 255, 0, 0.35)', activeColor: '#BFFF00' }, line: { color: '#BFFF00' }, rect: { borderColor: '#BFFF00', color: 'rgba(191, 255, 0, 0.15)' }, polygon: { borderColor: '#BFFF00', color: 'rgba(191, 255, 0, 0.15)' } }
              },
            });
          } else if (currentMode === 'light') {
            chartInstance = new KLineChartLight({
              container: containerRef!,
              symbol: currentSymbol,
              period: currentPeriod,
              datafeed: datafeed,
              onPeriodChange: (p) => console.log('Light chart period changed to:', p),
            });
          }
          props.onChartReady(chartInstance);
          console.log('[ChartContainer.tsx] Chart instance CREATED.');
        } catch (e) {
          console.error("[ChartContainer.tsx] FATAL: Failed to initialize chart:", e);
        }

      }, 100); // 增加延迟以确保 DOM 完全准备好

      onCleanup(() => {
        console.log('[ChartContainer.tsx] Cleanup: Clearing init timeout.');
        clearTimeout(initTimeout);
      });
    }, 
    { defer: false }
  ));
  
  onCleanup(() => {
    console.log('[ChartContainer.tsx] Final component cleanup.');
    if (chartInstance) {
      if (chartInstance instanceof KLineChartPro) {
        chartInstance.getChart()?.destroy();
      } else {
        chartInstance.destroy();
      }
      chartInstance = null;
      props.onChartReady(null);
    }
    if (containerRef) {
      dispose(containerRef);
      containerRef.innerHTML = '';
    }
  });

  return (
    <>
      {console.log('[ChartContainer.tsx] Rendering div container...')}
      <div ref={containerRef} style={{ width: '100%', height: '100%', "min-height": "0", "min-width": "0" }} />
    </>
  );
};

export default ChartContainer;
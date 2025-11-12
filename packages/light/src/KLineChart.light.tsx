import { Component, createSignal, onMount, onCleanup, Show, For, createEffect, on } from 'solid-js';
import { init, dispose, Chart, KLineData, ActionType, SymbolInfo, Period } from '@klinecharts/core';
import { ChartProLightOptions, Datafeed } from './types';

interface DisplayData {
  price: string;
  change: string;
  changeValue: number;
}

interface InternalProps extends Omit<ChartProLightOptions, 'container' | 'symbol' | 'period'> {
  symbol: SymbolInfo;
  period: Period;
  datafeed: Datafeed;
  ref: (chart: Chart | null) => void;
}

const ChartProLightComponent: Component<InternalProps> = props => {
  let chartContainer: HTMLDivElement | undefined;
  let chart: Chart | null = null;

  const [resolvedSymbol, setResolvedSymbol] = createSignal<SymbolInfo | null>(null);
  const [currentData, setCurrentData] = createSignal<DisplayData>({ price: '', change: '', changeValue: 0 });
  const [activePeriod, setActivePeriod] = createSignal(props.period);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [subscriptionGuid, setSubscriptionGuid] = createSignal<string | null>(null);

  const formatData = (klineData: KLineData | null, prevKlineData: KLineData | null): DisplayData => {
    if (!klineData) return { price: '', change: '', changeValue: 0 };
    
    const prevClose = prevKlineData?.close ?? klineData.open;
    const changeValue = klineData.close - prevClose;
    const changePcnt = prevClose === 0 ? 0 : (changeValue / prevClose) * 100;
    
    return {
      price: `$${klineData.close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)} (${changePcnt.toFixed(2)}%)`,
      changeValue: changeValue,
    };
  };

  createEffect(on(() => props.symbol.ticker, (ticker) => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setResolvedSymbol(null);
    props.datafeed.resolveSymbol(
      ticker,
      (symbolInfo) => { setResolvedSymbol(symbolInfo); },
      (reason) => { setError(`Symbol Error: ${reason}`); setLoading(false); }
    );
  }));

  createEffect(on([resolvedSymbol, activePeriod], ([symbol, period]) => {
    if (!chart || !symbol || !period) return;
    setLoading(true);
    setError(null);
    chart.clearData();
    const guid = subscriptionGuid();
    if (guid) props.datafeed.unsubscribe(guid);

    props.datafeed.getHistoryKLineData(
      symbol, period, { from: 0, to: 0, firstDataRequest: true },
      (klineData, meta) => {
        chart?.applyNewData(klineData, meta.more);
        const dataList = chart!.getDataList();
        setCurrentData(formatData(dataList[dataList.length - 1], dataList[dataList.length - 2]));
        setLoading(false);

        const newGuid = `light_sub_${symbol.ticker}_${period.text}_${Date.now()}`;
        props.datafeed.subscribe(symbol, period, data => {
          chart?.updateData(data);
          const dataList = chart!.getDataList();
          setCurrentData(formatData(data, dataList[dataList.length - 2]));
        }, newGuid);
        setSubscriptionGuid(newGuid);
      },
      (reason) => { setLoading(false); setError(`Failed to load data: ${reason}`); }
    );
  }));

  onMount(() => {
    chart = init(chartContainer!, {
      // --- 关键修正 1：定义布局，将X轴空间置于顶部 ---
      layout: [
        { type: 'xAxis', options: { height: 22, position: 'top' } },
        { type: 'candle' }
      ],
      styles: {
        grid: { show: false },
        xAxis: { show: false }, // 保持X轴本身不可见
        yAxis: { show: false },
        crosshair: {
          show: true,
          horizontal: { show: false },
          vertical: {
            show: true,
            line: { show: true, style: 'solid', size: 1, color: '#929AA5' },
            text: {
              show: true,
              color: '#000',
              backgroundColor: '#929AA5',
              size: 12,
              paddingLeft: 4,
              paddingRight: 4,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 2,
              borderSize: 0,
              // --- 关键修正 2：垂直居中对齐 ---
              baseline: 'middle', 
            },
          },
        },
        candle: {
          type: 'area',
          tooltip: { showRule: 'none' },
          area: {
            lineSize: 2,
            lineColor: '#e8e8e8',
            value: 'close',
            smooth: true,
            backgroundColor: 'transparent',
            point: {
              show: true,
              color: '#FFFFFF',
              radius: 4,
              rippleColor: 'rgba(255, 255, 255, 0.3)',
              rippleRadius: 8,
              animation: true,
              animationDuration: 1000
            }
          }
        },
        separator: {
          size: 0
        }
      }
    });
    props.ref(chart);

    if (chart) {
      chart.setLoadDataCallback(params => {
        const symbol = resolvedSymbol();
        const period = activePeriod();
        if (params.type === 'forward' && params.data && symbol) {
          props.datafeed.getHistoryKLineData(
            symbol, period, { from: params.data.timestamp, to: 0, firstDataRequest: false },
            (klineData, meta) => { params.callback(klineData, meta.more); },
            (reason) => { console.error("Load more data error:", reason); params.callback([]); }
          );
        } else {
          params.callback([]);
        }
      });

      chart.subscribeAction(ActionType.OnCrosshairChange, (data: any) => {
        const dataList = chart!.getDataList();
        if (data.kLineData) {
          const dataIndex = data.dataIndex ?? -1;
          setCurrentData(formatData(dataList[dataIndex], dataList[dataIndex - 1]));
        } else {
          const lastData = dataList[dataList.length - 1];
          const prevLastData = dataList[dataList.length - 2];
          setCurrentData(formatData(lastData, prevLastData));
        }
      });
    }

    onCleanup(() => {
      props.ref(null);
      const guid = subscriptionGuid();
      if (guid) props.datafeed.unsubscribe(guid);
      if (chartContainer) dispose(chartContainer);
    });
  });

  const handlePeriodChange = (period: Period) => {
    setActivePeriod(period);
    props.onPeriodChange?.(period);
  };
  
  return (
    <div class="klinecharts-light">
      <div class="klinecharts-light-header">
        <div class="symbol">{resolvedSymbol()?.name ?? props.symbol.name ?? props.symbol.ticker}</div>
        <Show when={currentData().price && !loading() && !error()}>
          <div class="price">{currentData().price}</div>
          <div class={`change ${currentData().changeValue >= 0 ? 'up' : 'down'}`}>
            {currentData().change}
          </div>
        </Show>
      </div>
      <div class="klinecharts-light-chart-container" ref={chartContainer}>
        <Show when={loading()}>
          <div style={{'position': 'absolute', 'top': '50%', 'left': '50%', 'transform': 'translate(-50%, -50%)', 'z-index': '10'}}>Loading...</div>
        </Show>
        <Show when={error()}>
          <div style={{'position': 'absolute', 'top': '50%', 'left': '50%', 'transform': 'translate(-50%, -50%)', 'color': '#F92855', 'z-index': '10'}}>{error()}</div>
        </Show>
      </div>
      <div class="klinecharts-light-periods">
        <For each={props.periods ?? [
          { key: '1D', text: '1D', multiplier: 1, timespan: 'day' },
          { key: '1W', text: '1W', multiplier: 1, timespan: 'week' },
          { key: '1M', text: '1M', multiplier: 1, timespan: 'month' },
          { key: '3M', text: '3M', multiplier: 3, timespan: 'month' },
          { key: '1Y', text: '1Y', multiplier: 1, timespan: 'year' },
          { key: '5Y', text: '5Y', multiplier: 5, timespan: 'year' }
        ]}>
          {(item) => (
            <div
              class="item"
              classList={{ active: activePeriod().text === item.text }}
              onClick={() => handlePeriodChange(item)}
            >
              {item.text}
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default ChartProLightComponent;
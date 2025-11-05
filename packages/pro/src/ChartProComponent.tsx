import { createSignal, createEffect, onMount, Show, onCleanup, Component, on, mergeProps } from 'solid-js';
import {
  init, dispose, utils, Nullable, Chart, OverlayMode, Styles,
  TooltipIconPosition, ActionType, PaneOptions, Indicator, DomPosition, FormatDateType, KLineData
} from '@klinecharts/core';
import lodashSet from 'lodash/set';
import lodashClone from 'lodash/cloneDeep';
import { SelectDataSourceItem, Loading, Resizer } from './component';
import {
  PeriodBar, DrawingBar, IndicatorModal, TimezoneModal, SettingModal,
  ScreenshotModal, IndicatorSettingModal, SymbolSearchModal,
  BottomBar, AccountManager, TradePanel
} from './widget';
import { translateTimezone } from './widget/timezone-modal/data';
import { SymbolInfo, Period, ChartProOptions, ChartPro, BrokerAPI, AccountInfo, Position, Order } from './types';
import { BrokerProvider } from './api/BrokerAPIContext';

export interface ChartProComponentProps extends Partial<Omit<ChartProOptions, 'container' | 'symbol'>> {
  symbol: SymbolInfo | string;
  ref: (chart: ChartPro) => void;
}

function createIndicator(widget: Nullable<Chart>, indicatorName: string, isStack?: boolean, paneOptions?: PaneOptions): Nullable<string> {
  if (indicatorName === 'VOL') {
    paneOptions = { gap: { bottom: 2 }, ...paneOptions };
  }
  return widget?.createIndicator({
    name: indicatorName,
    // @ts-expect-error
    createTooltipDataSource: ({ indicator, defaultStyles }) => {
      const icons = [];
      if (indicator.visible) {
        icons.push(defaultStyles.tooltip.icons[1]);
        icons.push(defaultStyles.tooltip.icons[2]);
        icons.push(defaultStyles.tooltip.icons[3]);
      } else {
        icons.push(defaultStyles.tooltip.icons[0]);
        icons.push(defaultStyles.tooltip.icons[2]);
        icons.push(defaultStyles.tooltip.icons[3]);
      }
      return { icons };
    }
  }, isStack, paneOptions) ?? null;
}

const ChartProComponent: Component<ChartProComponentProps> = p => {
  const props = mergeProps({ bottomBarVisible: true, drawingBarVisible: true }, p);

  let widgetRef: HTMLDivElement | undefined = undefined;
  let widget: Nullable<Chart> = null;
  let priceUnitDom: HTMLElement;

  const [theme, setTheme] = createSignal(props.theme);
  const [styles, setStyles] = createSignal(props.styles);
  const [locale, setLocale] = createSignal(props.locale);
  const [symbol, setSymbol] = createSignal<SymbolInfo>(typeof props.symbol === 'string' ? { ticker: props.symbol } : props.symbol);
  const [period, setPeriod] = createSignal(props.period);
  const [indicatorModalVisible, setIndicatorModalVisible] = createSignal(false);
  const [mainIndicators, setMainIndicators] = createSignal(props.mainIndicators ? [...props.mainIndicators] : []);
  const [subIndicators, setSubIndicators] = createSignal<Record<string, string>>({});
  const [timezoneModalVisible, setTimezoneModalVisible] = createSignal(false);
  const [timezone, setTimezone] = createSignal<SelectDataSourceItem>({ key: props.timezone!, text: translateTimezone(props.timezone!, props.locale) });
  const [settingModalVisible, setSettingModalVisible] = createSignal(false);
  const [widgetDefaultStyles, setWidgetDefaultStyles] = createSignal<Styles>();
  const [screenshotUrl, setScreenshotUrl] = createSignal('');
  const [drawingBarVisible, setDrawingBarVisible] = createSignal(props.drawingBarVisible);
  const [symbolSearchModalVisible, setSymbolSearchModalVisible] = createSignal(false);
  const [loadingVisible, setLoadingVisible] = createSignal(true);
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [indicatorSettingModalParams, setIndicatorSettingModalParams] = createSignal({
    visible: false, indicatorName: '', paneId: '', calcParams: [] as any[]
  });
  const [subscriptionGuid, setSubscriptionGuid] = createSignal<string | null>(null);
  
  const [accountManagerVisible, setAccountManagerVisible] = createSignal(false);
  const [tradePanelVisible, setTradePanelVisible] = createSignal(false);
  const [accountManagerHeight, setAccountManagerHeight] = createSignal(250);

  const [accountInfo, setAccountInfo] = createSignal<AccountInfo | null>(null);
  const [positions, setPositions] = createSignal<Position[]>([]);
  const [orders, setOrders] = createSignal<Order[]>([]);

  props.ref({
    setTheme,
    getTheme: () => theme(),
    setStyles,
    getStyles: () => widget!.getStyles(),
    setLocale,
    getLocale: () => locale(),
    setTimezone: (tz: string) => { setTimezone({ key: tz, text: translateTimezone(tz, locale()) }) },
    getTimezone: () => timezone().key,
    setSymbol: (s: SymbolInfo | string) => {
      const currentSymbol = symbol();
      const newTicker = typeof s === 'string' ? s : s.ticker;
      if (currentSymbol.ticker !== newTicker) {
        setSymbol(typeof s === 'string' ? { ticker: newTicker } : s);
      }
    },
    getSymbol: () => symbol(),
    setPeriod,
    getPeriod: () => period(),
    getChart: () => widget,
    getBrokerApi: () => props.brokerApi ?? null,
  });

  const documentResize = () => { widget?.resize(); };

  const handleHorizontalResize = (deltaY: number) => {
    setAccountManagerHeight(prev => {
      const newHeight = prev - deltaY;
      return Math.max(100, Math.min(newHeight, 500));
    });
  };
  
  createEffect(on(() => props.symbol, (s) => {
    if(s){
      setSymbol(typeof s === 'string' ? { ticker: s } : s);
    }
  }));

  createEffect(on([() => symbol().ticker, period], ([ticker, currentPeriod], prev) => {
    if (!ticker || !currentPeriod || (prev && prev[0] === ticker && prev[1] === currentPeriod)) {
      return;
    }
    const datafeed = props.datafeed!;
    setLoadingVisible(true);
    setLoadError(null);
    widget?.clearData();

    const guid = subscriptionGuid();
    if (guid) { datafeed.unsubscribe(guid); setSubscriptionGuid(null); }
    
    datafeed.resolveSymbol(
      ticker,
      (resolvedSymbol) => {
        setSymbol(resolvedSymbol);
        const params = { from: 0, to: 0, firstDataRequest: true };
        datafeed.getHistoryKLineData(
          resolvedSymbol, currentPeriod, params,
          (klineData, meta) => {
            widget?.applyNewData(klineData, meta.more);
            setLoadingVisible(false);
            const newGuid = `sub_${resolvedSymbol.ticker}_${currentPeriod.text}_${Date.now()}`;
            datafeed.subscribe(resolvedSymbol, currentPeriod, data => {
              widget?.updateData(data);
              if (props.brokerApi && typeof (props.brokerApi as any).updatePrice === 'function') {
                (props.brokerApi as any).updatePrice(resolvedSymbol.ticker, data.close);
              }
            }, newGuid);
            setSubscriptionGuid(newGuid);
          },
          (reason) => { setLoadingVisible(false); setLoadError(`Failed to get history data: ${reason}`); }
        );
      },
      (reason) => { setLoadingVisible(false); setLoadError(`Failed to resolve symbol '${ticker}': ${reason}`); }
    );
  }));

  onMount(() => {
    window.addEventListener('resize', documentResize);

    widget = init(widgetRef!, {
      customApi: {
        formatDate: (dateTimeFormat: Intl.DateTimeFormat, timestamp, format: string, type: FormatDateType) => {
          const p = period();
          switch (p.timespan) {
            case 'minute': return type === FormatDateType.XAxis ? utils.formatDate(dateTimeFormat, timestamp, 'HH:mm') : utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD HH:mm');
            case 'hour': return type === FormatDateType.XAxis ? utils.formatDate(dateTimeFormat, timestamp, 'MM-DD HH:mm') : utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD HH:mm');
            case 'day': case 'week': return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD');
            case 'month': return type === FormatDateType.XAxis ? utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM') : utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD');
            case 'year': return type === FormatDateType.XAxis ? utils.formatDate(dateTimeFormat, timestamp, 'YYYY') : utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD');
          }
          return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD HH:mm');
        }
      }
    });

    if (widget) {
      const watermarkContainer = widget.getDom('candle_pane', DomPosition.Main);
      if (watermarkContainer && props.watermark) {
        let watermark = document.createElement('div');
        watermark.className = 'klinecharts-pro-watermark';
        if (utils.isString(props.watermark)) {
          watermark.innerHTML = (props.watermark as string).replace(/(^\s*)|(\s*$)/g, '');
        } else {
          watermark.appendChild(props.watermark as Node);
        }
        watermarkContainer.appendChild(watermark);
      }

      const priceUnitContainer = widget.getDom('candle_pane', DomPosition.YAxis);
      if(priceUnitContainer){
        priceUnitDom = document.createElement('span');
        priceUnitDom.className = 'klinecharts-pro-price-unit';
        priceUnitContainer.appendChild(priceUnitDom);
      }
      
      widget.setLoadDataCallback(params => {
        if (params.type === 'forward' && params.data) {
          const s = symbol();
          const p = period();
          
          props.datafeed!.getHistoryKLineData(
            s, p, { from: params.data.timestamp, to: 0, firstDataRequest: false },
            (klineData, meta) => {
              params.callback(klineData, meta.more);
            },
            (reason) => {
              console.error("Load more data error:", reason);
              params.callback([]);
            }
          );
        } else {
          params.callback([]);
        }
      });

      mainIndicators().forEach(indicator => { createIndicator(widget, indicator, true, { id: 'candle_pane' }); });
      const subIndicatorMap: Record<string, string> = {};
      props.subIndicators?.forEach(indicator => {
        const paneId = createIndicator(widget, indicator, true);
        if (paneId) {
          subIndicatorMap[indicator] = paneId;
        }
      });
      setSubIndicators(subIndicatorMap);

      widget?.subscribeAction(ActionType.OnTooltipIconClick, (data) => {
        if (data.indicatorName) {
          switch (data.iconId) {
            case 'visible': widget?.overrideIndicator({ name: data.indicatorName, visible: true }, data.paneId); break;
            case 'invisible': widget?.overrideIndicator({ name: data.indicatorName, visible: false }, data.paneId); break;
            case 'setting': {
              const indicator = widget?.getIndicatorByPaneId(data.paneId, data.indicatorName) as Indicator;
              setIndicatorSettingModalParams({ visible: true, indicatorName: data.indicatorName, paneId: data.paneId, calcParams: indicator.calcParams });
              break;
            }
            case 'close': {
              if (data.paneId === 'candle_pane') {
                const newMainIndicators = [...mainIndicators()];
                widget?.removeIndicator('candle_pane', data.name);
                newMainIndicators.splice(newMainIndicators.indexOf(data.name), 1);
                setMainIndicators(newMainIndicators);
              } else {
                const newIndicators = { ...subIndicators() };
                widget?.removeIndicator(data.paneId, data.name);
                delete newIndicators[data.name];
                setSubIndicators(newIndicators);
              }
            }
          }
        }
      });
    }
  });
  
  onCleanup(() => { 
    window.removeEventListener('resize', documentResize);
    dispose(widgetRef!); 
  });

  createEffect(() => {
    const s = symbol();
    if (s?.priceCurrency && priceUnitDom) {
      priceUnitDom.innerHTML = s.priceCurrency.toLocaleUpperCase();
      priceUnitDom.style.display = 'flex';
    } else if (priceUnitDom) {
      priceUnitDom.style.display = 'none';
    }
    widget?.setPriceVolumePrecision(s?.pricePrecision ?? 2, s?.volumePrecision ?? 0);
  });

  createEffect(() => {
    const t = theme();
    widget?.setStyles(t);
    const color = t === 'dark' ? '#929AA5' : '#76808F';
    widget?.setStyles({
      indicator: {
        tooltip: {
          icons: [
            { id: 'visible', position: TooltipIconPosition.Middle, marginLeft: 8, marginTop: 7, icon: '\ue903', fontFamily: 'icomoon', size: 14, color, activeColor: color, backgroundColor: 'transparent', activeBackgroundColor: 'rgba(22, 119, 255, 0.15)' },
            { id: 'invisible', position: TooltipIconPosition.Middle, marginLeft: 8, marginTop: 7, icon: '\ue901', fontFamily: 'icomoon', size: 14, color, activeColor: color, backgroundColor: 'transparent', activeBackgroundColor: 'rgba(22, 119, 255, 0.15)' },
            { id: 'setting', position: TooltipIconPosition.Middle, marginLeft: 6, marginTop: 7, icon: '\ue902', fontFamily: 'icomoon', size: 14, color, activeColor: color, backgroundColor: 'transparent', activeBackgroundColor: 'rgba(22, 119, 255, 0.15)' },
            { id: 'close', position: TooltipIconPosition.Middle, marginLeft: 6, marginTop: 7, icon: '\ue900', fontFamily: 'icomoon', size: 14, color, activeColor: color, backgroundColor: 'transparent', activeBackgroundColor: 'rgba(22, 119, 255, 0.15)' }
          ]
        }
      }
    });
  });

  createEffect(() => { widget?.setLocale(locale()!); });
  createEffect(() => { widget?.setTimezone(timezone().key); });
  createEffect(() => {
    const s = styles();
    if (s) {
      widget?.setStyles(s);
      setWidgetDefaultStyles(lodashClone(widget!.getStyles()));
    }
  });

  createEffect(() => {
    accountManagerVisible();
    tradePanelVisible();
    accountManagerHeight();
    setTimeout(() => {
      widget?.resize();
    }, 50);
  });

  return (
    <BrokerProvider value={props.brokerApi ?? null}>
      <i class="icon-close klinecharts-pro-load-icon"/>
      <Show when={symbolSearchModalVisible()}>
        <SymbolSearchModal locale={props.locale!} datafeed={props.datafeed!} onSymbolSelected={symbol => { setSymbol(symbol) }} onClose={() => { setSymbolSearchModalVisible(false) }} />
      </Show>
      <Show when={indicatorModalVisible()}>
        <IndicatorModal
          locale={props.locale!} mainIndicators={mainIndicators()} subIndicators={subIndicators()}
          onClose={() => { setIndicatorModalVisible(false) }}
          onMainIndicatorChange={data => {
            const newMainIndicators = [...mainIndicators()];
            if (data.added) { createIndicator(widget, data.name, true, { id: 'candle_pane' }); newMainIndicators.push(data.name); }
            else { widget?.removeIndicator('candle_pane', data.name); newMainIndicators.splice(newMainIndicators.indexOf(data.name), 1); }
            setMainIndicators(newMainIndicators);
          }}
          onSubIndicatorChange={data => {
            const newSubIndicators = { ...subIndicators() };
            if (data.added) { const paneId = createIndicator(widget, data.name); if (paneId) { newSubIndicators[data.name] = paneId; } }
            else { if (data.paneId) { widget?.removeIndicator(data.paneId, data.name); delete newSubIndicators[data.name]; } }
            setSubIndicators(newSubIndicators);
          }} />
      </Show>
      <Show when={timezoneModalVisible()}>
        <TimezoneModal locale={props.locale!} timezone={timezone()} onClose={() => { setTimezoneModalVisible(false) }} onConfirm={setTimezone} />
      </Show>
      <Show when={settingModalVisible()}>
        <SettingModal
          locale={props.locale!} currentStyles={utils.clone(widget!.getStyles())}
          onClose={() => { setSettingModalVisible(false) }} onChange={style => { widget?.setStyles(style) }}
          onRestoreDefault={(options: SelectDataSourceItem[]) => {
            const style = {};
            options.forEach(option => { lodashSet(style, option.key, utils.formatValue(widgetDefaultStyles(), option.key)); });
            widget?.setStyles(style);
          }} />
      </Show>
      <Show when={screenshotUrl().length > 0}>
        <ScreenshotModal locale={props.locale!} url={screenshotUrl()} onClose={() => { setScreenshotUrl('') }} />
      </Show>
      <Show when={indicatorSettingModalParams().visible}>
        <IndicatorSettingModal
          locale={props.locale!} params={indicatorSettingModalParams()}
          onClose={() => { setIndicatorSettingModalParams({ visible: false, indicatorName: '', paneId: '', calcParams: [] }) }}
          onConfirm={(params) => {
            const modalParams = indicatorSettingModalParams();
            widget?.overrideIndicator({ name: modalParams.indicatorName, calcParams: params }, modalParams.paneId);
          }} />
      </Show>
      <PeriodBar
        locale={props.locale!} symbol={symbol()} spread={drawingBarVisible()!} period={period()!} periods={props.periods!}
        onMenuClick={() => { setDrawingBarVisible(!drawingBarVisible()); setTimeout(() => widget?.resize(), 0) }}
        onSymbolClick={() => { setSymbolSearchModalVisible(!symbolSearchModalVisible()) }}
        onPeriodChange={setPeriod} onIndicatorClick={() => { setIndicatorModalVisible((visible => !visible)) }}
        onTimezoneClick={() => { setTimezoneModalVisible((visible => !visible)) }}
        onSettingClick={() => { setSettingModalVisible((visible => !visible)) }}
        onScreenshotClick={() => { if (widget) { setScreenshotUrl(widget.getConvertPictureUrl(true, 'jpeg', theme() === 'dark' ? '#151517' : '#ffffff')); } }}
        onRobotClick={props.onRobotClick} 
      />
      <div class="klinecharts-pro-main-container">
        <div class="klinecharts-pro-content">
          <Show when={loadingVisible()}><Loading /></Show>
          <Show when={loadError()}>
            <div class="klinecharts-pro-load-error">
              <span>{loadError()}</span>
              <button onClick={() => setSymbol(s => ({ ...s }))}>Retry</button>
            </div>
          </Show>
          <Show when={drawingBarVisible()}>
            <DrawingBar
              locale={props.locale!} onDrawingItemClick={overlay => { widget?.createOverlay(overlay) }}
              onModeChange={mode => { widget?.overrideOverlay({ mode: mode as OverlayMode }) }}
              onLockChange={lock => { widget?.overrideOverlay({ lock }) }}
              onVisibleChange={visible => { widget?.overrideOverlay({ visible }) }}
              onRemoveClick={(groupId) => { widget?.removeOverlay({ groupId }) }} 
            />
          </Show>
          <div ref={widgetRef} class='klinecharts-pro-widget' />
          <Show when={tradePanelVisible()}>
            <TradePanel />
          </Show>
        </div>
        
        <Show when={props.bottomBarVisible}>
          <BottomBar
            locale={props.locale!}
            accountManagerVisible={accountManagerVisible()}
            tradePanelVisible={tradePanelVisible()}
            onAccountManagerClick={() => setAccountManagerVisible(v => !v)}
            onTradeClick={() => setTradePanelVisible(v => !v)}
          />
          <Show when={accountManagerVisible()}>
            <>
              <Resizer direction="horizontal" onResize={handleHorizontalResize} />
              <div style={{ height: `${accountManagerHeight()}px`, 'flex-shrink': '0' }}>
                <AccountManager
                  accountInfo={accountInfo}
                  positions={positions}
                  orders={orders}
                  refetchPositions={async () => {
                    const pos = await props.brokerApi?.getPositions();
                    if (pos) setPositions(pos);
                  }}
                />
              </div>
            </>
          </Show>
        </Show>
      </div>
    </BrokerProvider>
  );
};

export default ChartProComponent;
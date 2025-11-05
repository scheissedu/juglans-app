// packages/pro/src/index.ts (修正后)
import { registerOverlay, dispose } from '@klinecharts/core';
import overlays from './extension';
import { load } from './i18n';
import './index.less';

export * from './component';

// --- 核心修正：从这里导出所有需要的 API ---
export { BrokerStateProvider, useBrokerState } from './api/BrokerStateContext';
export { BrokerProvider, useBroker } from './api/BrokerAPIContext';

export {
  OrderSide, OrderType, OrderStatus, PositionSide
} from './types';

export type {
  Order, Position, Execution, AccountInfo, InstrumentInfo, OrderParams,
  BrokerCallbacks, BrokerAPI, SymbolInfo, Period, DatafeedSubscribeCallback,
  Datafeed, ChartProOptions, ChartPro, TradeSuggestion, TakeProfitTarget
} from './types';
// --- 修正结束 ---

import DefaultDatafeed from './DefaultDatafeed';
import KLineChartPro from './KLineChartPro';

overlays.forEach(o => { registerOverlay(o); });

export {
  DefaultDatafeed,
  KLineChartPro,
  load as loadLocales,
  dispose
};
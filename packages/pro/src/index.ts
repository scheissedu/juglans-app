// packages/pro/src/index.ts

import { registerOverlay, dispose } from '@klinecharts/core';
import overlays from './extension';
import { load } from './i18n';
import './index.less';

export * from './component';

// --- 1. 从 API 文件中导入并导出所需内容 ---
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

import DefaultDatafeed from './DefaultDatafeed';
import KLineChartPro from './KLineChartPro';

overlays.forEach(o => { registerOverlay(o); });

export {
  DefaultDatafeed,
  KLineChartPro,
  load as loadLocales,
  dispose
};
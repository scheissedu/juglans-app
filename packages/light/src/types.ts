import { Chart, KLineData, Period, SymbolInfo } from '@klinecharts/core';

// --- 复用 pro 包的 Datafeed 接口定义 ---
export interface HistoryKLineDataParams {
  from: number;
  to: number;
  countBack?: number;
  firstDataRequest?: boolean;
}

export type DatafeedSubscribeCallback = (data: KLineData) => void;

export interface Datafeed {
  getHistoryKLineData(symbol: SymbolInfo, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): void;
  subscribe(symbol: SymbolInfo, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void;
  unsubscribe(listenerGuid: string): void;
}
// --- 接口定义结束 ---

export interface ChartProLightOptions {
  container: string | HTMLElement;
  symbol: SymbolInfo | string;
  period: Period;
  datafeed: Datafeed;
  periods?: Array<Period>;
  onPeriodChange?: (period: Period) => void;
}

export interface ChartProLight {
  getChart: () => Chart | null;
  updateData: (data: KLineData) => void;
  destroy: () => void;
}
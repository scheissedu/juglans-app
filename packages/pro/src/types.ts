import { KLineData, Styles, DeepPartial, Chart } from '@klinecharts/core';

export enum OrderSide { Buy = 'buy', Sell = 'sell' }
export enum OrderType { Market = 'market', Limit = 'limit', Stop = 'stop', StopLimit = 'stop-limit' }
export enum OrderStatus { Working = 'working', Filled = 'filled', Canceled = 'canceled', Rejected = 'rejected', PartiallyFilled = 'partially_filled' }
export enum PositionSide { Long = 'long', Short = 'short' }

export interface Order {
  id: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  stopPrice?: number;
  avgFillPrice?: number;
  qty: number;
  filledQty?: number;
  status: OrderStatus;
  timestamp: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: PositionSide;
  avgPrice: number;
  qty: number;
  unrealizedPnl?: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Execution {
  id: string;
  orderId: string;
  symbol: string;
  price: number;
  qty: number;
  side: OrderSide;
  timestamp: number;
  fee?: number;
  feeCurrency?: string;
}

export interface AccountInfo {
  id: string;
  name: string;
  currency: string;
  balance: number;
  equity: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
  margin?: number;
  orderMargin?: number;
  availableFunds?: number;
}

export interface InstrumentInfo {
  symbol: string;
  pricePrecision: number;
  qtyPrecision: number;
  minQty: number;
  maxQty: number;
  lotSize: number;
}

export type OrderParams = Omit<Partial<Order>, 'id' | 'status' | 'avgFillPrice' | 'filledQty' | 'timestamp'> & {
  id?: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  qty: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  reduceOnly?: boolean;
};

export interface BrokerCallbacks {
  onOrderUpdate: (order: Order) => void;
  onPositionUpdate: (position: Position) => void;
  onExecution: (execution: Execution) => void;
  onAccountInfoUpdate: (accountInfo: AccountInfo) => void;
}

export interface BrokerAPI {
  connect(): void;
  disconnect(): void;
  getAccountInfo(): Promise<AccountInfo>;
  getPositions(): Promise<Position[]>;
  getOrders(): Promise<Order[]>;
  getExecutions(): Promise<Execution[]>;
  getInstrumentInfo(symbol: SymbolInfo): Promise<InstrumentInfo>;
  placeOrder(order: OrderParams): Promise<void>;
  modifyOrder(order: OrderParams): Promise<void>;
  cancelOrder(orderId: string): Promise<void>;
  closePosition(positionId: string, qty?: number): Promise<void>;
  modifyPosition(positionId: string, sl_tp: { stopLoss?: number; takeProfit?: number }): Promise<void>;
  subscribe(callbacks: BrokerCallbacks): void;
  unsubscribe(): void;
  updatePrice?(symbol: string, price: number): void;
}

export interface HistoryKLineDataParams {
  from: number;
  to: number;
  countBack?: number;
  firstDataRequest?: boolean;
}

export interface DatafeedConfiguration {
  exchanges?: Array<{ value: string, name: string, desc: string }>;
  symbols_types?: Array<{ name: string, value: string }>;
  supported_resolutions: string[];
  supports_marks?: boolean;
  supports_timescale_marks?: boolean;
  supports_time?: boolean;
}

export interface SymbolInfo {
  ticker: string;
  name?: string;
  shortName?: string;
  exchange?: string;
  market?: string;
  pricePrecision?: number;
  volumePrecision?: number;
  priceCurrency?: string;
  type?: string;
  logo?: string;
  session?: string;
  timezone?: string;
  minmov?: number;
  minmove2?: number;
  pointvalue?: number;
  has_intraday?: boolean;
  has_daily?: boolean;
  has_weekly_and_monthly?: boolean;
  supported_resolutions?: string[];
}

export interface Period {
  multiplier: number;
  timespan: string;
  text: string;
}

export type DatafeedSubscribeCallback = (data: KLineData) => void;

export interface Datafeed {
  onReady(callback: (configuration: DatafeedConfiguration) => void): void;
  searchSymbols(userInput: string, onResult: (symbols: SymbolInfo[]) => void): void;
  resolveSymbol(ticker: string, onResolve: (symbol: SymbolInfo) => void, onError: (reason: string) => void): void;
  getHistoryKLineData(symbol: SymbolInfo, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): void;
  subscribe(symbol: SymbolInfo, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void;
  unsubscribe(listenerGuid: string): void;
}

export interface ChartProOptions {
  container: string | HTMLElement;
  styles?: DeepPartial<Styles>;
  watermark?: string | Node;
  theme?: string;
  locale?: string;
  drawingBarVisible?: boolean;
  bottomBarVisible?: boolean;
  symbol: SymbolInfo | string;
  period: Period;
  periods?: Period[];
  timezone?: string;
  mainIndicators?: string[];
  subIndicators?: string[];
  datafeed: Datafeed;
  brokerApi?: BrokerAPI;
  onRobotClick?: () => void;
}

export interface ChartPro {
  setTheme(theme: string): void;
  getTheme(): string;
  setStyles(styles: DeepPartial<Styles>): void;
  getStyles(): Styles;
  setLocale(locale: string): void;
  getLocale(): string;
  setTimezone(timezone: string): void;
  getTimezone(): string;
  setSymbol(symbol: SymbolInfo | string): void;
  getSymbol(): SymbolInfo;
  setPeriod(period: Period): void;
  getPeriod(): Period;
  getChart(): Chart | null;
  getBrokerApi(): BrokerAPI | null;
}

export interface TakeProfitTarget {
  price: number;
  portion_pct: number;
}

export interface TradeSuggestion {
  status: 'SUGGEST';
  strategy_name: string;
  confidence_score: number;
  summary: string;
  trade_suggestion: {
    direction: 'LONG' | 'SHORT';
    leverage: number;
    entry_price: number;
    stop_loss: number;
    take_profit: TakeProfitTarget[];
    quantity?: number;
    position_size_usd: number;
    risk_reward_ratio: number;
  };
}
// packages/juglans-app/src/components/cards-p/TradeSuggestionCard/types.ts
import type { OrderSide, OrderType, TakeProfitTarget } from '@klinecharts/pro';

// 定义市场类型
export type MarketType = 'FUTURES' | 'OPTION' | 'PREDICTION';

// 基础交易建议
export interface BaseTradeSuggestion {
  marketType: MarketType;
  summary: string;
  confidence_score: number;
}

// 1. 期货交易建议 (Futures)
export interface FuturesTradeSuggestion extends BaseTradeSuggestion {
  marketType: 'FUTURES';
  symbol: string;
  direction: 'LONG' | 'SHORT';
  leverage: number;
  entry_price: number;
  stop_loss: number;
  take_profit: { price: number; portion_pct: number }[];
  quantity?: number;
  position_size_usd: number;
  orderType?: OrderType;
}

// 2. 期权交易建议 (Options)
export interface OptionTradeSuggestion extends BaseTradeSuggestion {
  marketType: 'OPTION';
  underlying: string; // e.g., 'BTC-USD'
  expiry: string; // e.g., '2025-12-26'
  strike: number;
  optionType: 'CALL' | 'PUT';
  direction: 'BUY' | 'SELL';
  quantity: number; // 合约数量
  price?: number; // 限价
  orderType: OrderType;
}

// 3. 预测市场交易建议 (Prediction)
export interface PredictionTradeSuggestion extends BaseTradeSuggestion {
  marketType: 'PREDICTION';
  marketSlug: string; // e.g., 'will-trump-win-2024'
  outcome: 'YES' | 'NO';
  direction: 'BUY' | 'SELL';
  quantity: number; // 份额数量
  price: number; // 价格/概率 (0.01 - 0.99)
}

// 使用联合类型来代表所有可能的交易建议
export type TradeSuggestionData = FuturesTradeSuggestion | OptionTradeSuggestion | PredictionTradeSuggestion;

// 定义卡片内部的可交互状态，并导出
export type SizeUnit = 'BASE' | 'QUOTE';
export type MarginMode = 'ISOLATED' | 'CROSSED';
export type CardStatus = 'SUGGESTED' | 'MODIFIED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'DECLINED';

export interface LocalTradeState {
  marketType: 'FUTURES' | 'OPTION' | 'PREDICTION' | null;
  status: CardStatus;
  // Futures specific
  direction?: OrderSide;
  orderType: OrderType;
  size: number;
  sizeUnit: SizeUnit;
  price?: number;
  triggerPrice?: number;
  leverage?: number;
  marginMode?: MarginMode;
  stopLoss?: number;
  takeProfits: TakeProfitTarget[];
  isAdvancedOpen: boolean;
  reduceOnly: boolean;
  // Common
  symbol?: string;
}
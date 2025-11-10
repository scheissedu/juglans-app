// packages/juglans-app/src/components/chat/cards/TradeSuggestionCard/types.ts
import type { OrderSide, OrderType, TakeProfitTarget } from '@klinecharts/pro';

export interface TradeSuggestionData {
  status: 'SUGGEST';
  strategy_name: string;
  confidence_score: number;
  summary: string;
  trade_suggestion: {
    symbol: string;
    direction: 'LONG' | 'SHORT';
    leverage: number;
    entry_price: number;
    stop_loss: number;
    take_profit: TakeProfitTarget[];
    quantity?: number;
    position_size_usd: number;
    orderType?: OrderType;
  };
}
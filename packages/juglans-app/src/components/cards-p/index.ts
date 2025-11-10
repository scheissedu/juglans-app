// index.ts
import { CardDefinition, CardType } from './types';
import { balanceCardDefinition } from './BalanceCard';
import { klineCardDefinition } from './KLineDataCard';
import { positionCardDefinition } from './PositionCard';
import { tradeSuggestionCardDefinition } from './TradeSuggestionCard';

// 中央卡片注册表
export const cardRegistry = new Map<CardType, CardDefinition>([
  ['balance', balanceCardDefinition],
  ['kline', klineCardDefinition],
  ['position', positionCardDefinition],
  ['tradeSuggestion', tradeSuggestionCardDefinition],
]);
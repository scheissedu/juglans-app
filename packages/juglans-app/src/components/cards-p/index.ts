// packages/juglans-app/src/components/cards-p/index.ts
import { CardDefinition, CardType } from './types';
import { balanceCardDefinition } from './BalanceCard';
import { klineCardDefinition } from './KLineDataCard';
import { positionCardDefinition } from './PositionCard';
import { tradeSuggestionCardDefinition } from './TradeSuggestionCard';
import { symbolInfoCardDefinition } from './SymbolInfoCard'; // 1. 导入新的卡片定义

// 中央卡片注册表
export const cardRegistry = new Map<CardType, CardDefinition>([
  ['balance', balanceCardDefinition],
  ['kline', klineCardDefinition],
  ['position', positionCardDefinition],
  ['tradeSuggestion', tradeSuggestionCardDefinition],
  ['symbolInfo', symbolInfoCardDefinition], // 2. 注册新的卡片
]);

// 确保 CardType 包含新的类型
// 你可能需要去 types.ts 更新这个联合类型
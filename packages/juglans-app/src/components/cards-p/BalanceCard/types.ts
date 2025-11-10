// packages/juglans-app/src/components/chat/cards/BalanceCard/types.ts
import type { AssetBalance } from '@klinecharts/pro';

// 定义从 CardNodeData 传入的 `data` 字段的具体类型
export type BalanceCardData = Record<string, AssetBalance>;

// 用于在组件内部处理的数据结构
export interface BalanceDisplayData {
  symbol: string;
  balance: AssetBalance;
}
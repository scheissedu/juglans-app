// packages/juglans-app/src/components/chat/cards/KLineDataCard/types.ts
import type { KLineData } from '@klinecharts/core';

// 定义 KLineDataCard 的专属数据结构
export interface KLineDataCardData {
  symbol: string;
  period: string;
  data: KLineData[];
}
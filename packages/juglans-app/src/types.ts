// packages/juglans-app/src/types.ts

// 定义一个标准化的实时行情数据结构
export interface TickerData {
  symbol: string;      // 交易对代码, e.g., 'BTC-USDT'
  lastPrice: number;   // 最新价格
  priceChange: number; // 24小时价格变化
  priceChangePercent: number; // 24小时价格变化百分比
  volume: number;      // 24小时成交量
  turnover: number;    // 24小时成交额
}
// packages/juglans-app/src/types.ts

export interface TickerData {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  turnover: number;
}

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  snippet: string;
  image?: string;
  
  tickers?: { symbol: string; changePercent: number }[];
  
  aiSummary?: string; // 1. 为 AI 总结添加一个可选字段

  // 保留旧字段为可选
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
}
// packages/juglans-app/src/types.ts

export interface TickerData {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  turnover: number;
}

// +++ 新增 RawStockInfo 类型 +++
export interface RawStockInfo {
  symbol: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
}


export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  snippet: string;
  image?: string;
  
  tickers?: { symbol: string; changePercent: number }[];
  
  aiSummary?: string;

  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
}

export interface OptionData {
  instrumentId: string;
  last: number;
  bid: number;
  ask: number;
  iv: number;
  delta: number;
  mark: number; 
  // +++ 新增字段以匹配 OKX UI +++
  vega: number;
  bidSize: number;
  askSize: number;
}

export type ProcessedOptionsChain = Map<number, {
  call?: OptionData;
  put?: OptionData;
}>;
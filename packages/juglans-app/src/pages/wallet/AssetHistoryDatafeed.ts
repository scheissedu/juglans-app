// packages/juglans-app/src/pages/wallet/AssetHistoryDatafeed.ts
import { KLineData } from '@klinecharts/core';
import { Datafeed, SymbolInfo, Period, HistoryKLineDataParams, DatafeedConfiguration } from '@klinecharts/light';

// This is a mock datafeed that generates a random walk for asset history
export default class AssetHistoryDatafeed implements Datafeed {
  
  // --- 核心修改 1: 添加 onReady 方法 ---
  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    // For this simple chart, we don't need complex configuration.
    // We just need to signal that the datafeed is ready.
    setTimeout(() => callback({ supported_resolutions: ['1D'] }), 0);
  }

  // --- 核心修改 2: 添加 resolveSymbol 方法 ---
  resolveSymbol(
    ticker: string, 
    onResolve: (symbol: SymbolInfo) => void, 
    onError: (reason: string) => void
  ): void {
    // Since we are not fetching real symbol data, we can just resolve
    // with a minimal SymbolInfo object.
    setTimeout(() => {
      onResolve({
        ticker: ticker,
        name: 'Asset Value History',
        pricePrecision: 2,
        volumePrecision: 0,
      });
    }, 0);
  }

  getHistoryKLineData(
    symbol: SymbolInfo, 
    period: Period, 
    params: HistoryKLineDataParams, 
    onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void
  ): void {
    const data: KLineData[] = [];
    let lastClose = 100000; // Starting value
    const now = Date.now();
    
    // Generate 100 data points for demonstration
    for (let i = 100; i > 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000; // daily data
      const open = lastClose;
      const close = open + (Math.random() - 0.48) * open * 0.05; // Random fluctuation
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      
      data.push({ timestamp, open, high, low, close, volume: 0, turnover: 0 });
      lastClose = close;
    }
    
    setTimeout(() => onResult(data, { noData: false, more: false }), 100);
  }

  subscribe() {}
  unsubscribe() {}
  
  // --- 核心修改 3: 添加 searchSymbols 方法 (以防万一) ---
  searchSymbols(userInput: string, onResult: (symbols: SymbolInfo[]) => void): void {
    onResult([]); // Not needed for this use case
  }
}
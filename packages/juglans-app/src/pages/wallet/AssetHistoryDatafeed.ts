// packages/juglans-app/src/pages/wallet/AssetHistoryDatafeed.ts
import { KLineData } from '@klinecharts/core';
import { Datafeed, SymbolInfo, Period, HistoryKLineDataParams, DatafeedConfiguration } from '@klinecharts/light';

// This is a mock datafeed that generates a random walk for asset history
export default class AssetHistoryDatafeed implements Datafeed {
  
  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    // We can define the supported "ranges" here
    setTimeout(() => callback({ supported_resolutions: ['1D', '1W', '1M', '1Y'] }), 0);
  }

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
    period: Period, // This 'period' now represents the range, e.g., { text: '1W' }
    params: HistoryKLineDataParams, 
    onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void
  ): void {
    
    // --- Core logic modification is here ---
    const range = period.text || '1D'; // Default range is 1D
    let pointsToGenerate = 100;
    let timeStep = 24 * 60 * 60 * 1000; // Default to one point per day

    switch (range) {
      case '1D':
        // For a 1D range, we simulate 288 5-minute data points (24 * 60 / 5)
        pointsToGenerate = 288;
        timeStep = 5 * 60 * 1000;
        break;
      case '1W':
        // For a 1W range, we simulate 168 1-hour data points (7 * 24)
        pointsToGenerate = 168;
        timeStep = 60 * 60 * 1000;
        break;
      case '1M':
        // For a 1M range, we simulate 120 6-hour data points (30 * 4)
        pointsToGenerate = 120;
        timeStep = 6 * 60 * 60 * 1000;
        break;
      case '1Y':
        // For a 1Y range, we simulate 365 1-day data points
        pointsToGenerate = 365;
        timeStep = 24 * 60 * 60 * 1000;
        break;
    }

    const data: KLineData[] = [];
    let lastClose = 100000; // Starting value
    const now = Date.now();
    
    // Generate mock data based on calculated parameters
    for (let i = pointsToGenerate; i > 0; i--) {
      const timestamp = now - i * timeStep;
      const open = lastClose;
      const close = open + (Math.random() - 0.48) * open * 0.02; // Reduced volatility for a sparkline look
      const high = Math.max(open, close); // Simplified high/low
      const low = Math.min(open, close);
      
      data.push({ timestamp, open, high, low, close, volume: 0, turnover: 0 });
      lastClose = close;
    }
    
    setTimeout(() => onResult(data, { noData: false, more: false }), 100);
  }

  subscribe() {}
  unsubscribe() {}
  
  searchSymbols(userInput: string, onResult: (symbols: SymbolInfo[]) => void): void {
    onResult([]); // Not needed for this use case
  }
}
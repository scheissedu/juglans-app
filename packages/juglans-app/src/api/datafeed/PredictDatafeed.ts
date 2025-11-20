// packages/juglans-app/src/api/datafeed/PredictDatafeed.ts
import { KLineData, SymbolInfo, Period } from '@klinecharts/core';
import type { Datafeed, HistoryKLineDataParams, DatafeedConfiguration, DatafeedSubscribeCallback } from '@klinecharts/light';

const API_BASE = '/api-kalshi'; 

function periodToMinutes(period: Period): number {
  switch (period.timespan) {
    case 'minute': return period.multiplier;
    case 'hour': return period.multiplier * 60;
    case 'day': return period.multiplier * 1440;
    default: return 60; 
  }
}

export default class PredictDatafeed implements Datafeed {
  
  // (searchEvents, getEventMetadata, getEventDetails, getMarketDetails, onReady, searchSymbols, resolveSymbol... 等方法保持不变)
  async searchEvents(userInput: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/events?status=open&with_nested_markets=true&search=${userInput}`);
      if (!response.ok) throw new Error(`API error for searchEvents: ${response.status}`);
      const result = await response.json();
      return result.events || [];
    } catch (error) {
      console.error("[PredictDatafeed] Search events failed:", error);
      return [];
    }
  }

  async getEventDetails(eventTicker: string): Promise<any | null> {
    if (!eventTicker) return null;
    try {
      const response = await fetch(`${API_BASE}/events/${eventTicker}`);
      if (!response.ok) throw new Error(`API error for getEventDetails: ${response.status}`);
      const result = await response.json();
      return result.event || null;
    } catch (error) {
      console.error(`[PredictDatafeed] Get details for event "${eventTicker}" failed:`, error);
      return null;
    }
  }

  async getEventMetadata(eventTicker: string): Promise<{ image_url: string } | null> {
    if (!eventTicker) return null;
    try {
      const response = await fetch(`${API_BASE}/events/${eventTicker}/metadata`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`API error for getEventMetadata: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[PredictDatafeed] Get metadata for event "${eventTicker}" failed:`, error);
      return null;
    }
  }

  async getMarketDetails(ticker: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE}/markets/${ticker}`);
      if (!response.ok) throw new Error(`API error for getMarketDetails: ${response.status}`);
      const result = await response.json();
      return result.market || null;
    } catch (error) {
      console.error(`[PredictDatafeed] Get details for ticker "${ticker}" failed:`, error);
      return null;
    }
  }
  
  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    setTimeout(() => callback({ supported_resolutions: ['1', '60', '1440'] }), 0);
  }
  
  searchSymbols(userInput: string, onResult: (symbols: SymbolInfo[]) => void): void {
    onResult([]);
  }

  resolveSymbol(ticker: string, onResolve: (symbol: SymbolInfo) => void, onError: (reason: string) => void): void {
    this.getMarketDetails(ticker).then(market => {
      if (market) {
        onResolve({
          ticker: market.ticker,
          name: market.title,
          pricePrecision: 2,
          volumePrecision: 0,
        });
      } else {
        onError('Market not found');
      }
    });
  }
  
  async getHistoryKLineData(symbol: SymbolInfo, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean; more?: boolean; }) => void, onError: (reason: string) => void, seriesTickerOverride?: string): Promise<void> {
    try {
      const seriesTicker = seriesTickerOverride;
      if (!seriesTicker) {
        throw new Error(`Could not find series_ticker for market: ${symbol.ticker}`);
      }

      const periodInMinutes = periodToMinutes(period);
      const end_ts = Math.floor((params.from || Date.now()) / 1000);
      const start_ts = end_ts - 300 * periodInMinutes * 60;
      const url = `${API_BASE}/series/${seriesTicker}/markets/${symbol.ticker}/candlesticks?start_ts=${start_ts}&end_ts=${end_ts}&period_interval=${periodInMinutes}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error for history (${url}): ${response.status}`);
      
      const result = await response.json();
      
      // --- 核心修正：数据填充逻辑 ---
      const rawKlineData: KLineData[] = (result.candlesticks || []).map((p: any) => ({
        timestamp: p.end_period_ts * 1000, 
        open: (p.price.open ?? p.price.close) / 100, // 如果 open 为 null，使用 close
        high: (p.price.high ?? p.price.close) / 100,
        low: (p.price.low ?? p.price.close) / 100,
        close: p.price.close / 100,
        volume: parseFloat(p.volume),
      }));

      if (rawKlineData.length === 0) {
        onResult([], { noData: true });
        return;
      }

      const filledData: KLineData[] = [];
      let lastValidPrice = rawKlineData[0].close; // 初始价格

      for (const point of rawKlineData) {
        // Kalshi API 在没有交易时 volume 为 0, 并且 price.close 仍然是上一个价格
        // 但有时 price.open/high/low 可能为 null。我们需要确保 OHLC 都有值。
        if (point.volume > 0) {
          lastValidPrice = point.close;
          filledData.push(point);
        } else {
          // 如果没有交易量，创建一个价格不变的数据点
          filledData.push({
            ...point,
            open: lastValidPrice,
            high: lastValidPrice,
            low: lastValidPrice,
            close: lastValidPrice,
          });
        }
      }
      
      onResult(filledData, { noData: filledData.length === 0, more: filledData.length > 0 });

    } catch (error: any) {
      console.error(`[PredictDatafeed] Failed to get history for ${symbol.ticker}: ${error.message}`);
      onError(error.message);
    }
  }

  subscribe(symbol: SymbolInfo, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {}
  unsubscribe(listenerGuid: string): void {}
}
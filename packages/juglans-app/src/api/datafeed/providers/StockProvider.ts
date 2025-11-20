// packages/juglans-app/src/api/datafeed/providers/StockProvider.ts

import { KLineData } from '@klinecharts/core';
import { Datafeed, Period, DatafeedSubscribeCallback, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';
import { Instrument } from '@/instruments';
import { TickerData } from '../../../types';

const API_BASE_URL = '/api/v1/finance/stocks';

export default class StockProvider implements Datafeed {

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    setTimeout(() => callback({
      supported_resolutions: ['1m', '5m', '15m', '30m', '1h', '1d', '1w', '1M'],
    }), 0);
  }

  // --- 核心修改：增加 A股和港股的识别逻辑 ---
  async searchSymbols(userInput: string, onResult: (instruments: Instrument[]) => void): Promise<void> {
    if (!userInput) {
      onResult([]);
      return;
    }

    const query = userInput.toUpperCase().trim();
    const results: Instrument[] = [];

    // 1. 港股逻辑 (3-5位纯数字) -> 补全为 .HK
    if (/^\d{3,5}$/.test(query)) {
      const padded = query.padStart(4, '0');
      const hkSymbol = `${padded}.HK`;
      results.push(new Instrument(`HK_STOCK:${hkSymbol}.HKEX@HKD_SPOT`));
    }

    // 2. A股逻辑 (6位纯数字) -> 6开头.SS, 0/3开头.SZ
    if (/^\d{6}$/.test(query)) {
      if (query.startsWith('6')) {
        results.push(new Instrument(`CN_STOCK:${query}.SS.SSE@CNY_SPOT`));
      } else if (query.startsWith('0') || query.startsWith('3')) {
        results.push(new Instrument(`CN_STOCK:${query}.SZ.SZSE@CNY_SPOT`));
      }
    }

    // 3. 美股逻辑 (字母) 或其他情况作为 Fallback
    if (/^[A-Z]+$/.test(query) || results.length === 0) {
       results.push(new Instrument(`US_STOCK:${query}.NASDAQ@USD_SPOT`));
    }

    onResult(results);
  }

  async resolveSymbol(identifier: string, onResolve: (instrument: Instrument) => void, onError: (reason: string) => void): Promise<void> {
    const instrument = new Instrument(identifier);
    onResolve(instrument);
  }

  async getHistoryKLineData(instrument: Instrument, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): Promise<void> {
    const ticker = instrument.baseSymbol;
    
    const interval = this._mapPeriodToInterval(period);
    const queryParams = new URLSearchParams({
      ticker: ticker,
      interval: interval,
    });

    if (params.firstDataRequest) {
       queryParams.append('period', this._mapIntervalToDefaultPeriod(interval));
    } else {
       if (params.to) {
         queryParams.append('end', params.to.toString());
       }
       queryParams.append('period', 'max');
    }

    try {
      const url = `${API_BASE_URL}/historical?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const rawData = await response.json();
      
      if (!Array.isArray(rawData) || rawData.length === 0) {
        onResult([], { noData: true });
        return;
      }

      const klineData: KLineData[] = rawData.sort((a: any, b: any) => a.timestamp - b.timestamp);
      onResult(klineData, { noData: false, more: !params.firstDataRequest }); 

    } catch (error: any) {
      console.error('[StockProvider] Error:', error);
      onError(error.message);
    }
  }

  async getTickerInfo(symbol: string): Promise<TickerData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/quote?ticker=${symbol}`);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        symbol: data.symbol || symbol,
        lastPrice: data.lastPrice || 0,
        priceChange: data.priceChange || 0,
        priceChangePercent: data.priceChangePercent || 0,
        volume: data.volume || 0,
        turnover: data.marketCap || 0
      };
    } catch (error) {
      return null;
    }
  }

  async getSparklineData(ticker: string): Promise<number[]> {
    try {
      const params = new URLSearchParams({
        ticker: ticker,
        period: '5d',
        interval: '60m'
      });
      const response = await fetch(`${API_BASE_URL}/historical?${params.toString()}`);
      if (!response.ok) return [];
      const rawData = await response.json();
      if (!Array.isArray(rawData)) return [];
      return rawData.map((item: any) => item.close);
    } catch (e) {
      return [];
    }
  }

  subscribe(instrument: Instrument, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {}
  unsubscribe(listenerGuid: string): void {}

  private _mapPeriodToInterval(period: Period): string {
    if (period.timespan === 'minute') {
      if ([1, 2, 5, 15, 30, 60, 90].includes(period.multiplier)) {
        return `${period.multiplier}m`;
      }
      return '1m'; 
    }
    if (period.timespan === 'hour') return '1h';
    if (period.timespan === 'day') return '1d';
    if (period.timespan === 'week') return '1wk';
    if (period.timespan === 'month') return '1mo';
    return '1d';
  }

  private _mapIntervalToDefaultPeriod(interval: string): string {
    if (interval.endsWith('m')) {
        if (interval === '1m') return '5d'; 
        return '1mo'; 
    }
    if (interval.endsWith('h')) return '6mo';
    if (interval === '1d') return '2y';
    if (interval === '1wk') return '5y';
    if (interval === '1mo') return 'max';
    return '1y';
  }
}
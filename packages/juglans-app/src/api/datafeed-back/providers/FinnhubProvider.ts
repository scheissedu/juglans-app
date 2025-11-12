// packages/juglans-app/src/api/datafeed/providers/FinnhubProvider.ts

import { KLineData } from '@klinecharts/core';
import { Datafeed, SymbolInfo, Period, DatafeedSubscribeCallback, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';

const API_BASE_URL = 'https://finnhub.io/api/v1';

export default class FinnhubProvider implements Datafeed {
  private _apiKey: string;

  constructor(apiKey: string) {
    this._apiKey = apiKey;
    if (!apiKey) {
      console.error("FinnhubProvider: API key is missing.");
    }
  }

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    setTimeout(() => callback({ supported_resolutions: ['D', 'W', 'M'] }), 0);
  }

  async searchSymbols(userInput: string, onResult: (symbols: SymbolInfo[]) => void): Promise<void> {
    if (!this._apiKey) {
      onResult([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${userInput}&token=${this._apiKey}`);
      const data = await response.json();
      const symbols: SymbolInfo[] = (data.result || [])
        .filter((s: any) => s.type === 'Common Stock' && !s.symbol.includes('.') && s.symbol.length <= 5)
        .map((s: any) => ({
          ticker: s.symbol,
          name: s.description,
          shortName: s.symbol,
          exchange: 'US Stocks',
          market: 'stocks',
          type: 'stock',
        }));
      onResult(symbols);
    } catch (error) {
      console.error("[FinnhubProvider] Search symbols error:", error);
      onResult([]);
    }
  }

  async resolveSymbol(ticker: string, onResolve: (symbol: SymbolInfo) => void, onError: (reason: string) => void): Promise<void> {
    if (!this._apiKey) {
      onError("Finnhub API key is missing.");
      return;
    }
     try {
      const response = await fetch(`${API_BASE_URL}/stock/profile2?symbol=${ticker}&token=${this._apiKey}`);
      const data = await response.json();
      if (data && data.ticker) {
        onResolve({
          ticker: data.ticker,
          name: data.name,
          shortName: data.ticker,
          exchange: data.exchange,
          market: 'stocks',
          type: 'stock',
          logo: data.logo,
          pricePrecision: 2,
          volumePrecision: 0,
          timezone: 'America/New_York',
          session: '0930-1600',
        });
      } else {
        throw new Error('Symbol not found on Finnhub');
      }
    } catch (error: any) {
      onError(error.message);
    }
  }

  async getHistoryKLineData(symbol: SymbolInfo, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): Promise<void> {
    if (!this._apiKey) {
      onError("Finnhub API key is missing.");
      return;
    }
    const resolution = 'D'; // Finnhub free plan often limited to daily
    const to = Math.floor(Date.now() / 1000);
    const from = to - 365 * 2 * 24 * 60 * 60; // Fetch 2 years of data

    try {
      const url = `${API_BASE_URL}/stock/candle?symbol=${symbol.ticker}&resolution=${resolution}&from=${from}&to=${to}&token=${this._apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.s !== 'ok') {
        throw new Error(data.errmsg || 'Failed to fetch history data from Finnhub');
      }

      const klineData: KLineData[] = [];
      for(let i = 0; i < data.t.length; i++) {
        klineData.push({ timestamp: data.t[i] * 1000, open: data.o[i], high: data.h[i], low: data.l[i], close: data.c[i], volume: data.v[i] });
      }
      onResult(klineData, { noData: klineData.length === 0, more: false });
    } catch (error: any) {
      onError(error.message);
    }
  }

  subscribe(symbol: SymbolInfo, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {
    // Real-time data for stocks often requires a paid plan. Not implemented for free tier.
  }
  
  unsubscribe(listenerGuid: string): void {
    // No-op
  }
}
// packages/juglans-app/src/api/datafeed/providers/FinnhubProvider.ts
import { KLineData } from '@klinecharts/core';
import { Datafeed, Period, DatafeedSubscribeCallback, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';
import { Instrument, AssetClass, ProductType } from '@/instruments';

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

  async searchSymbols(userInput: string, onResult: (instruments: Instrument[]) => void): Promise<void> {
    if (!this._apiKey) { onResult([]); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${userInput}&token=${this._apiKey}`);
      const data = await response.json();
      const instruments: Instrument[] = (data.result || [])
        .filter((s: any) => s.type === 'Common Stock' && !s.symbol.includes('.') && s.symbol.length <= 5)
        .map((s: any) => {
          const identifier = `US_STOCK:${s.symbol}.NASDAQ@USD_SPOT`; // Assume NASDAQ for simplicity
          return new Instrument(identifier);
        });
      onResult(instruments);
    } catch (error) {
      console.error("[FinnhubProvider] Search symbols error:", error);
      onResult([]);
    }
  }

  async resolveSymbol(identifier: string, onResolve: (instrument: Instrument) => void, onError: (reason: string) => void): Promise<void> {
    if (!this._apiKey) { onError("Finnhub API key is missing."); return; }
    const instrument = new Instrument(identifier);
    const tickerForApi = instrument.baseSymbol;
     try {
      const response = await fetch(`${API_BASE_URL}/stock/profile2?symbol=${tickerForApi}&token=${this._apiKey}`);
      const data = await response.json();
      if (data && data.ticker) {
        // Here we could enrich the instrument, but for now we just resolve the initial one
        onResolve(instrument);
      } else {
        throw new Error('Symbol not found on Finnhub');
      }
    } catch (error: any) {
      onError(error.message);
    }
  }

  async getHistoryKLineData(instrument: Instrument, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): Promise<void> {
    if (!this._apiKey) { onError("Finnhub API key is missing."); return; }
    const resolution = 'D'; // Finnhub free plan often limited to daily
    const to = Math.floor(Date.now() / 1000);
    const from = to - 365 * 2 * 24 * 60 * 60; // Fetch 2 years of data
    const tickerForApi = instrument.baseSymbol;

    try {
      const url = `${API_BASE_URL}/stock/candle?symbol=${tickerForApi}&resolution=${resolution}&from=${from}&to=${to}&token=${this._apiKey}`;
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

  subscribe(instrument: Instrument, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {
    // Real-time data for stocks often requires a paid plan. Not implemented for free tier.
  }
  
  unsubscribe(listenerGuid: string): void {
    // No-op
  }
}
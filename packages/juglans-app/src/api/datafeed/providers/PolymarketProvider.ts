// packages/juglans-app/src/api/datafeed/providers/PolymarketProvider.ts
import { KLineData } from '@klinecharts/core';
import { Datafeed, Period, DatafeedSubscribeCallback, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';
import { Instrument } from '@/instruments';

const GAMMA_API_BASE = '/api-polymarket-gamma/markets';
const CLOB_API_BASE = '/api-polymarket-clob/markets';

function periodToGranularity(period: Period): number {
  switch (period.timespan) {
    case 'minute': return period.multiplier * 60;
    case 'hour': return period.multiplier * 3600;
    case 'day': return period.multiplier * 86400;
    case 'week': return period.multiplier * 604800;
    default: return 3600;
  }
}

export default class PolymarketProvider implements Datafeed {
  private _subscriptions = new Map<string, number>();

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    setTimeout(() => callback({
      supported_resolutions: ['15m', '1H', '4H', '1D'],
    }), 0);
  }

  async searchSymbols(userInput: string, onResult: (instruments: any[]) => void): Promise<void> {
    try {
      const response = await fetch(`${GAMMA_API_BASE}?populate=*&filters[active]=true&filters[question][$containsi]=${userInput}&sort[0]=volume%3Adesc&pagination[limit]=50`);
      if (!response.ok) {
        throw new Error(`Proxy failed for searchSymbols with status: ${response.status}`);
      }
      
      // --- 核心修正：API 直接返回数组，不再访问 .data ---
      const markets = await response.json();
      if (!Array.isArray(markets)) {
        console.error("Expected an array from Polymarket search API, but got:", markets);
        onResult([]);
        return;
      }
      
      onResult(markets);
    } catch (error) {
      console.error("[PolymarketProvider] Search failed:", error);
      onResult([]);
    }
  }

  async resolveSymbol(identifier: string, onResolve: (instrument: Instrument) => void, onError: (reason: string) => void): Promise<void> {
    try {
      const instrument = new Instrument(identifier);
      const slug = instrument.baseSymbol;
      
      const response = await fetch(`${GAMMA_API_BASE}?filters[slug][$eq]=${slug}`);
      if (!response.ok) {
        throw new Error(`Proxy failed for resolveSymbol with status: ${response.status}`);
      }
      
      // --- 核心修正：API 直接返回数组，不再访问 .data ---
      const marketDetails = await response.json();
      
      if (marketDetails && marketDetails.length > 0) {
        onResolve(instrument);
      } else {
        throw new Error('Market not found');
      }
    } catch (error: any) {
      onError(error.message);
    }
  }

  // ... 其余方法保持不变 ...
  async getHistoryKLineData(instrument: Instrument, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean; more?: boolean; }) => void, onError: (reason: string) => void): Promise<void> {
    const slug = instrument.baseSymbol;
    const outcome = instrument.identifier.endsWith('_YES') ? 'Yes' : 'No';
    const granularity = periodToGranularity(period);

    try {
      const url = `${CLOB_API_BASE}/${slug}/candles?granularity=${granularity}&outcome=${outcome}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error via proxy: ${response.status}`);
      
      const history: [number, number, number, number, number, number][] = await response.json();
      
      const klineData: KLineData[] = history.map(p => ({
        timestamp: p[0] * 1000,
        open: p[3],
        high: p[2],
        low: p[1],
        close: p[4],
        volume: p[5],
      })).reverse();
      
      onResult(klineData, { noData: klineData.length === 0, more: false });
    } catch (error: any) {
      onError(error.message);
    }
  }

  subscribe(instrument: Instrument, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {
    const intervalId = setInterval(async () => {
      try {
        const slug = instrument.baseSymbol;
        const outcome = instrument.identifier.endsWith('_YES') ? 'Yes' : 'No';
        const url = `${CLOB_API_BASE}/${slug}`;
        const response = await fetch(url);
        const marketData = await response.json();
        
        const price = outcome === 'Yes' ? marketData.price_yes : marketData.price_no;
        const lastTick = {
          timestamp: new Date(marketData.last_trade_time).getTime(),
          open: price, high: price, low: price, close: price,
          volume: 0,
        };
        onTick(lastTick);

      } catch (error) {
        console.error(`[PolymarketProvider] Polling error for ${instrument.identifier}:`, error);
      }
    }, 15000);
    this._subscriptions.set(listenerGuid, intervalId as unknown as number);
  }

  unsubscribe(listenerGuid: string): void {
    const intervalId = this._subscriptions.get(listenerGuid);
    if (intervalId) {
      clearInterval(intervalId);
      this._subscriptions.delete(listenerGuid);
    }
  }
}
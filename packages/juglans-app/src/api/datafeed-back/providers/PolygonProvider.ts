// packages/juglans-app/src/api/datafeed/providers/PolygonProvider.ts

import { KLineData } from '@klinecharts/core';
import {
  Datafeed,
  SymbolInfo,
  Period,
  DatafeedSubscribeCallback,
  DatafeedConfiguration,
  HistoryKLineDataParams
} from '@klinecharts/pro';

const supportedResolutions = ['1', '5', '15', '30', '60', 'D', 'W', 'M'];

interface Subscription {
  symbolTicker: string;
  period: Period;
  onTick: DatafeedSubscribeCallback;
}

export default class PolygonProvider implements Datafeed {
  private _apiKey: string;
  private _ws?: WebSocket;
  private _wsReady: boolean = false;
  private _currentMarket: string = '';

  private _subscriptions: Map<string, Subscription> = new Map();

  constructor(apiKey: string) {
    this._apiKey = apiKey;
  }

  private _connectWebSocket(market: string) {
    if (this._ws && this._currentMarket === market) {
      return;
    }

    this._ws?.close();
    this._currentMarket = market;
    this._ws = new WebSocket(`wss://delayed.polygon.io/${market}`);
    
    this._ws.onopen = () => {
      this._ws?.send(JSON.stringify({ action: 'auth', params: this._apiKey }));
    };

    this._ws.onmessage = (event) => {
      const result = JSON.parse(event.data);
      if (Array.isArray(result)) {
        result.forEach(msg => {
          if (msg.ev === 'status' && msg.status === 'auth_success') {
            this._wsReady = true;
            const tickers = new Set<string>();
            this._subscriptions.forEach(sub => tickers.add(sub.symbolTicker));
            if (tickers.size > 0) {
              this._ws?.send(JSON.stringify({ action: 'subscribe', params: Array.from(tickers).join(',') }));
            }
          } else if (msg.ev === 'T') {
            this._subscriptions.forEach(sub => {
              if (sub.symbolTicker === msg.sym) {
                sub.onTick({
                  timestamp: msg.s,
                  open: msg.o,
                  high: msg.h,
                  low: msg.l,
                  close: msg.p,
                  volume: msg.v,
                  turnover: 0
                });
              }
            });
          }
        });
      }
    };

    this._ws.onclose = () => {
      this._wsReady = false;
      console.log('[PolygonProvider] WebSocket disconnected.');
    };

    this._ws.onerror = (error) => {
      console.error('[PolygonProvider] WebSocket error:', error);
    };
  }

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    setTimeout(() => {
      callback({
        supported_resolutions: supportedResolutions,
        exchanges: [
          { value: 'XNYS', name: 'NYSE', desc: 'New York Stock Exchange' },
          { value: 'XNAS', name: 'NASDAQ', desc: 'NASDAQ' },
        ],
        symbols_types: [
          { name: 'All types', value: '' },
          { name: 'Stock', value: 'CS' },
          { name: 'ADRC', value: 'ADRC' },
        ]
      });
    }, 0);
  }

  async searchSymbols(userInput: string, onResult: (symbols: SymbolInfo[]) => void): Promise<void> {
    try {
      const response = await fetch(`https://api.polygon.io/v3/reference/tickers?apiKey=${this._apiKey}&active=true&search=${userInput ?? ''}`);
      const result = await response.json();
      const symbols = (result.results || []).map((data: any) => ({
        ticker: data.ticker,
        name: data.name,
        shortName: data.ticker,
        market: data.market,
        exchange: data.primary_exchange,
        priceCurrency: data.currency_name,
        type: data.type,
      }));
      onResult(symbols);
    } catch (error: any) {
      console.error("[PolygonProvider] Search symbols error:", error.message);
      onResult([]);
    }
  }

  async resolveSymbol(ticker: string, onResolve: (symbol: SymbolInfo) => void, onError: (reason: string) => void): Promise<void> {
    try {
      const response = await fetch(`https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${this._apiKey}`);
      const result = await response.json();

      if (result.status === 'OK' && result.results) {
        const data = result.results;
        const symbol: SymbolInfo = {
          ticker: data.ticker,
          name: data.name,
          shortName: data.ticker,
          market: data.market,
          exchange: data.primary_exchange,
          priceCurrency: data.currency_name,
          type: data.type,
          pricePrecision: 2,
          volumePrecision: 0,
          timezone: data.market === 'stocks' ? 'America/New_York' : 'Etc/UTC',
          supported_resolutions: supportedResolutions,
          has_intraday: true,
          session: data.market === 'stocks' ? '0930-1600' : '24x7',
        };
        onResolve(symbol);
      } else {
        throw new Error(result.error || 'Symbol not found');
      }
    } catch (error: any) {
      console.error(`[PolygonProvider] Resolve symbol error for ${ticker}:`, error.message);
      onError(error.message);
    }
  }

  async getHistoryKLineData(symbol: SymbolInfo, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): Promise<void> {
    const { from, to } = params;
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol.ticker}/range/${period.multiplier}/${period.timespan}/${from}/${to}?apiKey=${this._apiKey}&sort=asc&limit=5000`;
    try {
      const response = await fetch(url);
      const result = await response.json();

      if (result.status === 'ERROR' || result.status === 'FAILED' || !response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      const klineData = (result.results || []).map((data: any) => ({
        timestamp: data.t,
        open: data.o,
        high: data.h,
        low: data.l,
        close: data.c,
        volume: data.v,
        turnover: data.vw
      }));
      
      onResult(klineData, { noData: klineData.length === 0, more: klineData.length > 0 });

    } catch (error: any) {
      console.error(`[PolygonProvider] Get history k-line error: ${error.message}`);
      onError(error.message);
    }
  }

  subscribe(symbol: SymbolInfo, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {
    if (this._currentMarket !== symbol.market) {
      this._connectWebSocket(symbol.market!);
    }
    
    const ticker = `T.${symbol.ticker}`;
    let isNewTickerSubscription = true;
    this._subscriptions.forEach(sub => {
      if (sub.symbolTicker === ticker) {
        isNewTickerSubscription = false;
      }
    });

    this._subscriptions.set(listenerGuid, { symbolTicker: ticker, period, onTick });

    if (isNewTickerSubscription && this._wsReady) {
      this._ws?.send(JSON.stringify({ action: 'subscribe', params: ticker }));
    }
    console.log(`[PolygonProvider] Subscribed: ${listenerGuid} to ${ticker}`);
  }

  unsubscribe(listenerGuid: string): void {
    const subscription = this._subscriptions.get(listenerGuid);
    if (subscription) {
      this._subscriptions.delete(listenerGuid);
      let isTickerStillSubscribed = false;
      this._subscriptions.forEach(sub => {
        if (sub.symbolTicker === subscription.symbolTicker) {
          isTickerStillSubscribed = true;
        }
      });
      if (!isTickerStillSubscribed && this._wsReady) {
        this._ws?.send(JSON.stringify({ action: 'unsubscribe', params: subscription.symbolTicker }));
        console.log(`[PolygonProvider] WebSocket unsubscribed from ${subscription.symbolTicker}`);
      }
    }
  }
}
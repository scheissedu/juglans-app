// packages/juglans-app/src/api/datafeed/providers/BinanceProvider.ts

import { KLineData } from '@klinecharts/core';
import { Datafeed, SymbolInfo, Period, DatafeedSubscribeCallback, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';

const API_BASE_URL = 'https://api.binance.com';
const WS_BASE_URL = 'wss://stream.binance.com:9443/ws';

export default class BinanceProvider implements Datafeed {
  private _ws?: WebSocket;
  private _subscriptions: Map<string, { streamName: string, onTick: DatafeedSubscribeCallback }> = new Map();
  private _wsReady: boolean = false;
  private _reconnectTimeout: any;

  constructor() {
    this._connectWebSocket();
  }

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    const supportedResolutions = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '1w', '1M'];
    setTimeout(() => callback({ 
      supported_resolutions: supportedResolutions,
      exchanges: [{ value: 'BINANCE', name: 'Binance', desc: 'Binance Exchange' }],
    }), 0);
  }

  async searchSymbols(userInput: string, onResult: (symbols: SymbolInfo[]) => void): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v3/exchangeInfo`);
      const result = await response.json();
      const symbols: SymbolInfo[] = result.symbols
        .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT' && (s.symbol.toLowerCase().includes(userInput.toLowerCase()) || s.baseAsset.toLowerCase().includes(userInput.toLowerCase())))
        .map((s: any) => ({
          ticker: s.symbol,
          name: `${s.baseAsset}/${s.quoteAsset}`,
          shortName: s.symbol,
          exchange: 'Binance',
          market: 'spot',
          type: 'crypto',
        }));
      onResult(symbols);
    } catch (error) {
      console.error("[BinanceProvider] Search symbols error:", error);
      onResult([]);
    }
  }

  async resolveSymbol(ticker: string, onResolve: (symbol: SymbolInfo) => void, onError: (reason: string) => void): Promise<void> {
    this.searchSymbols(ticker, (symbols) => {
        const symbol = symbols.find(s => s.ticker === ticker);
        if (symbol) {
            onResolve({ ...symbol, timezone: 'Etc/UTC', session: '24x7' });
        } else {
            onError('Symbol not found');
        }
    });
  }

  async getHistoryKLineData(symbol: SymbolInfo, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): Promise<void> {
    const interval = this._periodToBinanceInterval(period);
    const limit = params.firstDataRequest ? 500 : 200;
    const url = `${API_BASE_URL}/api/v3/klines?symbol=${symbol.ticker}&interval=${interval}&limit=${limit}${params.from ? `&endTime=${params.from - 1}`: ''}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error(data.msg || 'Invalid data from Binance API');
      }
      const klineData: KLineData[] = data.map((d: any[]) => ({
        timestamp: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
        turnover: parseFloat(d[7]),
      }));
      onResult(klineData, { noData: klineData.length === 0, more: klineData.length > 0 });
    } catch (error: any) {
      console.error(`[BinanceProvider] Get history error: ${error.message}`);
      onError(error.message);
    }
  }

  subscribe(symbol: SymbolInfo, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {
    if (!this._ws) this._connectWebSocket();
    const interval = this._periodToBinanceInterval(period);
    const streamName = `${symbol.ticker.toLowerCase()}@kline_${interval}`;
    
    this._subscriptions.set(listenerGuid, { streamName, onTick });
    
    if (this._wsReady) {
        this._ws?.send(JSON.stringify({ method: 'SUBSCRIBE', params: [streamName], id: 1 }));
    }
    console.log(`[BinanceProvider] Subscribed to ${streamName}`);
  }

  unsubscribe(listenerGuid: string): void {
    const sub = this._subscriptions.get(listenerGuid);
    if (sub && this._wsReady) {
      this._ws?.send(JSON.stringify({ method: 'UNSUBSCRIBE', params: [sub.streamName], id: 1 }));
      console.log(`[BinanceProvider] Unsubscribed from ${sub.streamName}`);
    }
    this._subscriptions.delete(listenerGuid);
  }
  
  private _connectWebSocket() {
    if (this._ws && this._ws.readyState !== WebSocket.CLOSED) return;

    this._ws = new WebSocket(WS_BASE_URL);
    this._ws.onopen = () => {
        console.log('[BinanceProvider] WebSocket connected.');
        this._wsReady = true;
        // Resubscribe to existing streams
        const params = Array.from(this._subscriptions.values()).map(s => s.streamName);
        if (params.length > 0) {
            this._ws?.send(JSON.stringify({ method: 'SUBSCRIBE', params, id: 1 }));
        }
    };
    this._ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.e === 'kline') {
            const streamName = msg.s.toLowerCase() + '@kline_' + msg.k.i;
            this._subscriptions.forEach(sub => {
                if (sub.streamName === streamName) {
                    sub.onTick({
                        timestamp: msg.k.t,
                        open: parseFloat(msg.k.o),
                        high: parseFloat(msg.k.h),
                        low: parseFloat(msg.k.l),
                        close: parseFloat(msg.k.c),
                        volume: parseFloat(msg.k.v),
                        turnover: parseFloat(msg.k.q)
                    });
                }
            });
        }
    };
    this._ws.onclose = () => {
        console.log('[BinanceProvider] WebSocket disconnected. Reconnecting...');
        this._wsReady = false;
        clearTimeout(this._reconnectTimeout);
        this._reconnectTimeout = setTimeout(() => this._connectWebSocket(), 5000);
    };
    this._ws.onerror = (error) => {
        console.error('[BinanceProvider] WebSocket error:', error);
    };
  }

  private _periodToBinanceInterval(period: Period): string {
    const { multiplier, timespan } = period;
    const timespanChar = timespan === 'hour' ? 'h' : timespan.charAt(0);
    return `${multiplier}${timespanChar}`;
  }
}
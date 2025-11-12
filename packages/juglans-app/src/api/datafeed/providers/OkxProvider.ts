// packages/juglans-app/src/api/datafeed/providers/OkxProvider.ts

import { KLineData } from '@klinecharts/core';
import { Datafeed, Period, DatafeedSubscribeCallback, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';
import { Instrument, AssetClass, ProductType } from '@/instruments';
import { TickerData } from '../../../types';

const API_BASE_URL = 'https://www.okx.com';
const supportedResolutions = ['1m', '3m', '5m', '15m', '30m', '1H', '2H', '4H', '6H', '12H', '1D', '1W', '1M'];

interface CandleSubscription {
  type: 'candle';
  channel: string;
  instId: string;
  onTick: DatafeedSubscribeCallback;
}

type Subscription = CandleSubscription;

export default class OkxProvider implements Datafeed {
  private _ws?: WebSocket;
  private _wsReady: boolean = false;
  private _heartbeatInterval: any;
  private _subscriptions: Map<string, Subscription> = new Map();

  constructor() {
    this._connectWebSocket();
  }
  
  private _connectWebSocket() {
    this._ws = new WebSocket('wss://wspri.okx.com:8443/ws/v5/public');

    this._ws.onopen = () => {
      console.log('[OkxProvider] WebSocket connected.');
      this._wsReady = true;
      this._heartbeatInterval = setInterval(() => {
        if (this._ws?.readyState === WebSocket.OPEN) {
          this._ws.send('ping');
        }
      }, 25000);
      
      const args: any[] = [];
      this._subscriptions.forEach(sub => {
        if (sub.type === 'candle') {
            args.push({ channel: sub.channel, instId: sub.instId });
        }
      });
      if (args.length > 0) {
        this._ws.send(JSON.stringify({ op: 'subscribe', args }));
      }
    };

    this._ws.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const result = JSON.parse(event.data);
        if (result.event === 'subscribe' || result.event === 'unsubscribe') {
          return;
        }

        if (result.arg?.channel.startsWith('candle') && result.data) {
          const candleData = result.data[0];
          const ticker = result.arg.instId;
          
          this._subscriptions.forEach((sub) => {
            if (sub.type === 'candle' && sub.instId === ticker && sub.channel === result.arg.channel) {
              sub.onTick({
                timestamp: parseInt(candleData[0], 10),
                open: parseFloat(candleData[1]),
                high: parseFloat(candleData[2]),
                low: parseFloat(candleData[3]),
                close: parseFloat(candleData[4]),
                volume: parseFloat(candleData[5]),
                turnover: parseFloat(candleData[6]),
              });
            }
          });
        }
      } catch (e) {
        console.error('[OkxProvider] Error parsing WebSocket message:', e);
      }
    };

    this._ws.onclose = () => {
      console.log('[OkxProvider] WebSocket disconnected. Reconnecting...');
      this._wsReady = false;
      clearInterval(this._heartbeatInterval);
      setTimeout(() => this._connectWebSocket(), 5000);
    };

    this._ws.onerror = (error) => {
      console.error('[OkxProvider] WebSocket error:', error);
    };
  }
  
  async getTickers(instType: 'SPOT'): Promise<TickerData[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v5/market/tickers?instType=${instType}`);
        const result = await response.json();
        if (result.code === '0' && result.data) {
            return result.data.map((tickerRaw: any) => ({
                symbol: tickerRaw.instId,
                lastPrice: parseFloat(tickerRaw.last),
                priceChange: parseFloat(tickerRaw.last) - parseFloat(tickerRaw.open24h),
                priceChangePercent: parseFloat(tickerRaw.open24h) === 0 ? 0 : (parseFloat(tickerRaw.last) / parseFloat(tickerRaw.open24h)) - 1,
                volume: parseFloat(tickerRaw.vol24h),
                turnover: parseFloat(tickerRaw.volCcy24h),
            }));
        }
        return [];
    } catch (error) {
        console.error('[OkxProvider] Failed to fetch tickers:', error);
        return [];
    }
  }

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    setTimeout(() => callback({ 
      supported_resolutions: supportedResolutions,
      exchanges: [{ value: 'OKX', name: 'OKX', desc: 'OKX Exchange' }],
    }), 0);
  }

  async searchSymbols(userInput: string, onResult: (instruments: Instrument[]) => void): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v5/public/instruments?instType=SPOT`);
      const result = await response.json();
      if (result.code === '0' && result.data) {
        const filteredData = result.data.filter((item: any) => 
          item.instId.toLowerCase().includes(userInput.toLowerCase()) ||
          item.baseCcy.toLowerCase().includes(userInput.toLowerCase())
        );
        const instruments: Instrument[] = filteredData.map((item: any) => {
          const identifier = `CRYPTO:${item.baseCcy}.${item.instId.includes('SWAP') ? 'DERIVATIVES' : 'OKX'}@${item.quoteCcy}_${item.instId.includes('SWAP') ? ProductType.PERP : ProductType.SPOT}`;
          return new Instrument(identifier);
        });
        onResult(instruments);
      } else { onResult([]); }
    } catch (error: any) {
      console.error("[OkxProvider] Search symbols error:", error.message);
      onResult([]);
    }
  }

  async resolveSymbol(identifier: string, onResolve: (instrument: Instrument) => void, onError: (reason: string) => void): Promise<void> {
    const instrument = new Instrument(identifier);
    const tickerForApi = instrument.getTicker();
    try {
      const response = await fetch(`${API_BASE_URL}/api/v5/public/instruments?instType=SPOT&instId=${tickerForApi}`);
      const result = await response.json();
      if (result.code === '0' && result.data && result.data.length > 0) {
        onResolve(instrument);
      } else { throw new Error(result.msg || 'Symbol not found'); }
    } catch (error: any) {
      console.error(`[OkxProvider] Resolve symbol error for ${tickerForApi}:`, error.message);
      onError(error.message);
    }
  }

  async getHistoryKLineData(instrument: Instrument, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): Promise<void> {
    const bar = this._periodToOkxBar(period);
    const tickerForApi = instrument.getTicker();
    let url: string;
    if (params.firstDataRequest) {
      url = `${API_BASE_URL}/api/v5/market/history-candles?instId=${tickerForApi}&bar=${bar}&limit=300`;
    } else {
      url = `${API_BASE_URL}/api/v5/market/history-candles?instId=${tickerForApi}&bar=${bar}&after=${params.from}&limit=100`;
    }

    try {
      const response = await fetch(url);
      const result = await response.json();
      if (result.code !== '0' || !result.data) {
        throw new Error(result.msg || 'Failed to fetch history data');
      }
      const klineData: KLineData[] = result.data.map((d: string[]) => ({
        timestamp: parseInt(d[0], 10), open: parseFloat(d[1]), high: parseFloat(d[2]),
        low: parseFloat(d[3]), close: parseFloat(d[4]), volume: parseFloat(d[5]),
        turnover: parseFloat(d[6]),
      })).reverse();
      onResult(klineData, { noData: klineData.length === 0, more: klineData.length > 0 });
    } catch (error: any) {
      console.error(`[OkxProvider] Get history k-line error: ${error.message}`);
      onError(error.message);
    }
  }

  subscribe(instrument: Instrument, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {
    const channel = this._periodToOkxCandleChannel(period);
    const instId = instrument.getTicker();
    const arg = { channel, instId };
    this._subscriptions.set(listenerGuid, { type: 'candle', channel, instId, onTick });
    if (this._wsReady) {
      this._ws?.send(JSON.stringify({ op: 'subscribe', args: [arg] }));
    }
  }

  unsubscribe(listenerGuid: string): void {
    const subscription = this._subscriptions.get(listenerGuid);
    if (subscription && subscription.type === 'candle') {
      this._subscriptions.delete(listenerGuid);
      let isTickerStillSubscribed = false;
      this._subscriptions.forEach(sub => {
        if (sub.type === 'candle' && sub.channel === subscription.channel && sub.instId === subscription.instId) {
          isTickerStillSubscribed = true;
        }
      });
      if (!isTickerStillSubscribed && this._wsReady) {
        const arg = { channel: subscription.channel, instId: subscription.instId };
        this._ws?.send(JSON.stringify({ op: 'unsubscribe', args: [arg] }));
      }
    }
  }
  
  private _periodToOkxBar(period: Period): string {
    const { multiplier, timespan } = period;
    if (timespan === 'minute') return `${multiplier}m`;
    if (timespan === 'hour') return `${multiplier}H`;
    if (timespan === 'day') return `${multiplier}D`;
    if (timespan === 'week') return `${multiplier}W`;
    if (timespan === 'month') return `${multiplier}M`;
    return '1D';
  }
  
  private _parsePrecision(precisionString: string): number {
    if (precisionString.includes('.')) {
      return precisionString.split('.')[1]?.length || 0;
    }
    return 0;
  }

  private _periodToOkxCandleChannel(period: Period): string {
    const bar = this._periodToOkxBar(period);
    return `candle${bar}`;
  }
}
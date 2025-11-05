import { KLineData, SymbolInfo, Period, DatafeedSubscribeCallback, Datafeed, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';
import OkxProvider from './providers/OkxProvider';
import BinanceProvider from './providers/BinanceProvider';
import PolygonProvider from './providers/PolygonProvider';
import { TickerData } from '../../types';

export default class UnifiedDatafeed implements Datafeed {
  private readonly _okx: OkxProvider;
  private readonly _binance: BinanceProvider;
  private readonly _polygon: PolygonProvider;
  
  private _subscriptionMap = new Map<string, Datafeed>();

  constructor() {
    this._okx = new OkxProvider();
    this._binance = new BinanceProvider();
    this._polygon = new PolygonProvider(import.meta.env.VITE_POLYGON_API_KEY || 'YOUR_POLYGON_API_KEY');
  }

  private _getProviderForSymbol(symbol: SymbolInfo): Datafeed {
    switch (symbol.exchange?.toUpperCase()) {
      case 'OKX':
        return this._okx;
      case 'BINANCE':
        return this._binance;
      case 'XNYS': // NYSE
      case 'XNAS': // NASDAQ
        return this._polygon;
    }
    if (symbol.ticker.includes('-')) {
      return this._okx;
    }
    if (symbol.type === 'crypto') {
        return this._binance;
    }
    return this._polygon;
  }

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    this._okx.onReady(config => {
      callback({
        ...config,
        exchanges: [
            { value: 'OKX', name: 'OKX', desc: 'OKX Exchange' },
            { value: 'BINANCE', name: 'Binance', desc: 'Binance Exchange' },
            { value: 'XNYS', name: 'NYSE', desc: 'New York Stock Exchange' },
            { value: 'XNAS', name: 'NASDAQ', desc: 'NASDAQ Stock Market' },
        ],
        symbols_types: [
            { name: 'All', value: '' },
            { name: 'Crypto', value: 'crypto' },
            { name: 'Stock', value: 'CS' },
        ]
      });
    });
  }

  async searchSymbols(userInput: string, onResult: (symbols: SymbolInfo[]) => void): Promise<void> {
    Promise.all([
      new Promise<SymbolInfo[]>(res => this._okx.searchSymbols(userInput, res)),
      new Promise<SymbolInfo[]>(res => this._binance.searchSymbols(userInput, res)),
      new Promise<SymbolInfo[]>(res => this._polygon.searchSymbols(userInput, res)),
    ]).then(results => {
      const allSymbols = results.flat();
      const uniqueSymbols = Array.from(new Map(allSymbols.map(s => [s.ticker, s])).values());
      onResult(uniqueSymbols);
    });
  }

  async resolveSymbol(ticker: string, onResolve: (symbol: SymbolInfo) => void, onError: (reason: string) => void): Promise<void> {
    Promise.any([
      new Promise<SymbolInfo>((res, rej) => this._okx.resolveSymbol(ticker, res, rej)),
      new Promise<SymbolInfo>((res, rej) => this._binance.resolveSymbol(ticker, res, rej)),
      new Promise<SymbolInfo>((res, rej) => this._polygon.resolveSymbol(ticker, res, rej)),
    ]).then(onResolve).catch(() => onError(`Cannot resolve symbol '${ticker}' from any source.`));
  }

  getHistoryKLineData(symbol: SymbolInfo, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): void {
    const provider = this._getProviderForSymbol(symbol);
    provider.getHistoryKLineData(symbol, period, params, onResult, onError);
  }

  subscribe(symbol: SymbolInfo, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {
    const provider = this._getProviderForSymbol(symbol);
    this._subscriptionMap.set(listenerGuid, provider);
    provider.subscribe(symbol, period, onTick, listenerGuid);
  }

  unsubscribe(listenerGuid: string): void {
    const provider = this._subscriptionMap.get(listenerGuid);
    if (provider) {
      provider.unsubscribe(listenerGuid);
      this._subscriptionMap.delete(listenerGuid);
    }
  }

  async getOkxTickers(): Promise<TickerData[]> {
    return this._okx.getTickers('SPOT');
  }
}
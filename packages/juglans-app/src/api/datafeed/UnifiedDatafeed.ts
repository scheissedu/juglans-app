// packages/juglans-app/src/api/datafeed/UnifiedDatafeed.ts
import { KLineData, SymbolInfo, Period, DatafeedSubscribeCallback, Datafeed, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';
import OkxProvider from './providers/OkxProvider';
import BinanceProvider from './providers/BinanceProvider';
import FinnhubProvider from './providers/FinnhubProvider'; // 重新引入
import { TickerData } from '../../types';

export default class UnifiedDatafeed implements Datafeed {
  private readonly _okx: OkxProvider;
  private readonly _binance: BinanceProvider;
  private readonly _finnhub: FinnhubProvider; // 重新引入
  
  private _subscriptionMap = new Map<string, Datafeed>();

  constructor() {
    this._okx = new OkxProvider();
    this._binance = new BinanceProvider();
    // 确保从环境变量中获取 API Key
    this._finnhub = new FinnhubProvider(import.meta.env.VITE_FINNHUB_API_KEY || '');
  }

  private _getProviderForSymbol(symbol: SymbolInfo): Datafeed {
    if (symbol.market === 'stocks') {
      return this._finnhub;
    }
    // 默认回退到加密货币提供商
    switch (symbol.exchange?.toUpperCase()) {
      case 'OKX': return this._okx;
      case 'BINANCE': return this._binance;
      default: return this._okx;
    }
  }

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    this._okx.onReady(config => {
      callback({
        ...config,
        exchanges: [
            { value: 'OKX', name: 'OKX', desc: 'OKX Exchange' },
            { value: 'BINANCE', name: 'Binance', desc: 'Binance Exchange' },
            { value: 'US', name: 'US Stocks', desc: 'US Stock Market' }, // 代表美股
        ],
        symbols_types: [
            { name: 'All', value: '' },
            { name: 'Crypto', value: 'crypto' },
            { name: 'Stock', value: 'stock' },
        ]
      });
    });
  }

  // 关键更新：searchSymbols 现在接收一个 assetType 参数
  async searchSymbols(userInput: string, assetType: 'crypto' | 'stocks', onResult: (symbols: SymbolInfo[]) => void): Promise<void> {
    if (assetType === 'stocks') {
      this._finnhub.searchSymbols(userInput, onResult);
    } else { // 'crypto'
      Promise.all([
        new Promise<SymbolInfo[]>(res => this._okx.searchSymbols(userInput, res)),
        new Promise<SymbolInfo[]>(res => this._binance.searchSymbols(userInput, res)),
      ]).then(results => {
        const allSymbols = results.flat();
        // 去重
        const uniqueSymbols = Array.from(new Map(allSymbols.map(s => [s.ticker, s])).values());
        onResult(uniqueSymbols);
      });
    }
  }

  async resolveSymbol(ticker: string, onResolve: (symbol: SymbolInfo) => void, onError: (reason: string) => void): Promise<void> {
    // Promise.any 会在任意一个 provider resolve 成功后立即返回
    Promise.any([
      new Promise<SymbolInfo>((res, rej) => this._okx.resolveSymbol(ticker, res, rej)),
      new Promise<SymbolInfo>((res, rej) => this._binance.resolveSymbol(ticker, res, rej)),
      new Promise<SymbolInfo>((res, rej) => this._finnhub.resolveSymbol(ticker, res, rej)),
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
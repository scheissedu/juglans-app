// packages/juglans-app/src/api/datafeed/UnifiedDatafeed.ts
import { KLineData, Period, DatafeedSubscribeCallback, Datafeed, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';
import { Instrument, AssetClass } from '@/instruments';
import OkxProvider from './providers/OkxProvider';
import BinanceProvider from './providers/BinanceProvider';
import StockProvider from './providers/StockProvider';
import { TickerData } from '../../types';

export default class UnifiedDatafeed implements Datafeed {
  private readonly _okx: OkxProvider;
  private readonly _binance: BinanceProvider;
  private readonly _stock: StockProvider;
  
  private _subscriptionMap = new Map<string, Datafeed>();

  constructor() {
    this._okx = new OkxProvider();
    this._binance = new BinanceProvider();
    this._stock = new StockProvider(); 
  }

  private _getProviderForInstrument(instrument: Instrument): Datafeed {
    // --- 修改：支持新的股票类型 ---
    if (
      instrument.assetClass === AssetClass.US_STOCK || 
      instrument.assetClass === AssetClass.HK_STOCK || 
      instrument.assetClass === AssetClass.CN_STOCK
    ) {
      return this._stock;
    }
    switch (instrument.market?.toUpperCase()) {
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
            { value: 'US', name: 'US Stocks', desc: 'US Stock Market' },
            { value: 'HK', name: 'HK Stocks', desc: 'HK Stock Market' }, // 新增
            { value: 'CN', name: 'CN Stocks', desc: 'A-Shares' }, // 新增
        ],
        symbols_types: [
            { name: 'All', value: '' },
            { name: 'Crypto', value: 'crypto' },
            { name: 'Stock', value: 'stock' },
        ]
      });
    });
  }

  async searchSymbols(userInput: string, assetType: 'crypto' | 'stocks', onResult: (instruments: Instrument[]) => void): Promise<void> {
    if (assetType === 'stocks') {
      this._stock.searchSymbols(userInput, onResult);
    } else { 
      Promise.all([
        new Promise<Instrument[]>(res => this._okx.searchSymbols(userInput, res)),
        new Promise<Instrument[]>(res => this._binance.searchSymbols(userInput, res)),
      ]).then(results => {
        const allInstruments = results.flat();
        const uniqueInstruments = Array.from(new Map(allInstruments.map(i => [i.identifier, i])).values());
        onResult(uniqueInstruments);
      });
    }
  }

  async resolveSymbol(identifier: string, onResolve: (instrument: Instrument) => void, onError: (reason: string) => void): Promise<void> {
    try {
      const tempInstrument = new Instrument(identifier);
      const provider = this._getProviderForInstrument(tempInstrument);
      provider.resolveSymbol(identifier, onResolve, onError);
    } catch (e) {
      onError(`Invalid instrument identifier: ${identifier}`);
    }
  }

  getHistoryKLineData(instrument: Instrument, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean, more?: boolean }) => void, onError: (reason: string) => void): void {
    const provider = this._getProviderForInstrument(instrument);
    provider.getHistoryKLineData(instrument, period, params, onResult, onError);
  }

  subscribe(instrument: Instrument, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {
    const provider = this._getProviderForInstrument(instrument);
    this._subscriptionMap.set(listenerGuid, provider);
    provider.subscribe(instrument, period, onTick, listenerGuid);
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

  async getRawOptionsData(underlying: string): Promise<any[]> {
    return this._okx.getRawOptionsData(underlying);
  }

  async getPopularStockInstruments(): Promise<Instrument[]> {
    // 增加一些默认的热门股票，包括腾讯和茅台
    const tickers = ['AAPL', 'TSLA', 'NVDA', 'AMD', 'MSFT', '0700.HK', '600519.SS', "0728.HK"];
    return tickers.map(ticker => {
      if (ticker.endsWith('.HK')) return new Instrument(`HK_STOCK:${ticker}.HKEX@HKD_SPOT`);
      if (ticker.endsWith('.SS')) return new Instrument(`CN_STOCK:${ticker}.SS@CNY_SPOT`);
      return new Instrument(`US_STOCK:${ticker}.NASDAQ@USD_SPOT`);
    });
  }

  async getStockTickers(symbols: string[]): Promise<Record<string, TickerData>> {
    if (symbols.length === 0) return {};
    const promises = symbols.map(symbol => this._stock.getTickerInfo(symbol));
    try {
      const results = await Promise.all(promises);
      const tickers: Record<string, TickerData> = {};
      results.forEach(tickerData => {
        if (tickerData) tickers[tickerData.symbol] = tickerData;
      });
      return tickers;
    } catch (error) {
      return {};
    }
  }

  async getSparklineData(symbol: string): Promise<number[]> {
    if (!symbol.includes('CRYPTO')) {
       return this._stock.getSparklineData(symbol);
    }
    return [];
  }
}
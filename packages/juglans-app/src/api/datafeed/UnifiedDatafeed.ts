// packages/juglans-app/src/api/datafeed/UnifiedDatafeed.ts
import { KLineData, Period, DatafeedSubscribeCallback, Datafeed, DatafeedConfiguration, HistoryKLineDataParams } from '@klinecharts/pro';
import { Instrument, AssetClass } from '@/instruments';
import OkxProvider from './providers/OkxProvider';
import BinanceProvider from './providers/BinanceProvider';
import FinnhubProvider from './providers/FinnhubProvider';
import { TickerData } from '../../types';

export default class UnifiedDatafeed implements Datafeed {
  private readonly _okx: OkxProvider;
  private readonly _binance: BinanceProvider;
  private readonly _finnhub: FinnhubProvider;
  
  private _subscriptionMap = new Map<string, Datafeed>();

  constructor() {
    this._okx = new OkxProvider();
    this._binance = new BinanceProvider();
    this._finnhub = new FinnhubProvider(import.meta.env.VITE_FINNHUB_API_KEY || '');
  }

  private _getProviderForInstrument(instrument: Instrument): Datafeed {
    if (instrument.assetClass === AssetClass.US_STOCK || instrument.assetClass === AssetClass.HK_STOCK) {
      return this._finnhub;
    }
    // Default to crypto providers
    switch (instrument.market?.toUpperCase()) {
      case 'OKX': return this._okx;
      case 'BINANCE': return this._binance;
      default: return this._okx; // Fallback crypto provider
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
      this._finnhub.searchSymbols(userInput, onResult);
    } else { // 'crypto'
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
    // We can use a temporary Instrument to decide the provider
    try {
      const tempInstrument = new Instrument(identifier);
      const provider = this._getProviderForInstrument(tempInstrument);
      
      // Delegate to the specific provider, which will resolve with a more detailed Instrument if needed
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
}
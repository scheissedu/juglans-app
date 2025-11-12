// packages/juglans-app/src/api/datafeed/ChartDatafeed.ts
import type { SymbolInfo, Datafeed, Period, KLineData, HistoryKLineDataParams, DatafeedConfiguration, DatafeedSubscribeCallback } from '@klinecharts/pro';
import UnifiedDatafeed from './UnifiedDatafeed';
import { Instrument } from '@/instruments';

/**
 * DatafeedWrapper acts as an adapter between our custom UnifiedDatafeed,
 * which resolves symbols into Instrument class instances and has a custom searchSymbols signature,
 * and KLineChartPro, which expects plain SymbolInfo objects and a standard searchSymbols signature.
 */
export default class ChartDatafeed implements Datafeed {
  private _datafeed: UnifiedDatafeed;

  constructor(datafeed: UnifiedDatafeed) {
    this._datafeed = datafeed;
  }

  onReady(callback: (configuration: DatafeedConfiguration) => void): void {
    this._datafeed.onReady(callback);
  }

  searchSymbols(userInput: string, onResult: (symbols: SymbolInfo[]) => void): void {
    // Since the standard interface doesn't have `assetType`, we search both and combine.
    Promise.all([
      new Promise<Instrument[]>(resolve => {
        this._datafeed.searchSymbols(userInput, 'crypto', resolve);
      }),
      new Promise<Instrument[]>(resolve => {
        this._datafeed.searchSymbols(userInput, 'stocks', resolve);
      })
    ]).then(([cryptoResults, stockResults]) => {
      const allInstruments = [...cryptoResults, ...stockResults];
      
      // Remove duplicates based on identifier
      const uniqueInstruments = Array.from(new Map(allInstruments.map(i => [i.identifier, i])).values());

      // Convert Instrument instances back to plain SymbolInfo objects for the chart component
      const symbolInfos: SymbolInfo[] = uniqueInstruments.map(instrument => ({
        ticker: instrument.identifier,
        name: instrument.getDisplayName(),
        shortName: instrument.baseSymbol,
        exchange: instrument.market,
        priceCurrency: instrument.quoteCurrency,
        market: instrument.assetClass.toLowerCase().includes('stock') ? 'stocks' : 'crypto',
      }));

      onResult(symbolInfos);
    });
  }

  resolveSymbol(identifier: string, onResolve: (symbol: SymbolInfo) => void, onError: (reason: string) => void): void {
    this._datafeed.resolveSymbol(
      identifier,
      (instrument: Instrument) => {
        // Convert the Instrument instance to a plain SymbolInfo object
        const symbolInfo: SymbolInfo = {
          ticker: instrument.identifier,
          name: instrument.getDisplayName(),
          shortName: instrument.getDisplayName(),
          exchange: instrument.market,
          priceCurrency: instrument.quoteCurrency,
          market: instrument.assetClass.toLowerCase().includes('stock') ? 'stocks' : 'crypto',
        };
        onResolve(symbolInfo);
      },
      onError
    );
  }

  getHistoryKLineData(symbol: SymbolInfo, period: Period, params: HistoryKLineDataParams, onResult: (data: KLineData[], meta: { noData?: boolean; more?: boolean; }) => void, onError: (reason: string) => void): void {
    // Convert SymbolInfo back to an Instrument for our internal datafeed
    const instrument = new Instrument(symbol.ticker);
    this._datafeed.getHistoryKLineData(instrument, period, params, onResult, onError);
  }

  subscribe(symbol: SymbolInfo, period: Period, onTick: DatafeedSubscribeCallback, listenerGuid: string): void {
    const instrument = new Instrument(symbol.ticker);
    this._datafeed.subscribe(instrument, period, onTick, listenerGuid);
  }

  unsubscribe(listenerGuid: string): void {
    this._datafeed.unsubscribe(listenerGuid);
  }
}
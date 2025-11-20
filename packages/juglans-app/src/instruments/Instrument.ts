// packages/juglans-app/src/instruments/Instrument.ts

import { AssetClass, ProductType } from './enums';

// 正则说明：
// 1. (?<assetClass>[A-Z_]+):  匹配资产类别 (如 CN_STOCK)
// 2. (?<underlying>.+?)       匹配标的物，使用非贪婪匹配，允许包含点号 (如 600519.SS)
// 3. (?:\.(?<market>[A-Z]+))? 匹配可选的市场后缀 (如 .SSE)，必须以点号开头
// 4. @(?<quoteCurrency>[A-Z]+) 匹配报价货币
// 5. _(?<productType>[A-Z_]+)  匹配产品类型
const INSTRUMENT_REGEX = /^(?<assetClass>[A-Z_]+):(?<underlying>.+?)(?:\.(?<market>[A-Z]+))?@(?<quoteCurrency>[A-Z]+)_(?<productType>[A-Z_]+)$/;

export class Instrument {
  public readonly identifier: string;
  public readonly assetClass: AssetClass;
  public readonly underlyingIdentifier: string;
  public readonly baseSymbol: string; // yfinance ticker, e.g., "600519.SS", "AAPL"
  public readonly market?: string;    // Internal market code, e.g., "SSE", "NASDAQ"
  public readonly quoteCurrency: string;
  public readonly productType: ProductType;

  // Derivatives specific
  public readonly expiry?: Date;
  public readonly strike?: number;
  public readonly optionType?: 'C' | 'P';

  constructor(identifier: string) {
    this.identifier = identifier;

    const match = identifier.match(INSTRUMENT_REGEX);

    if (!match || !match.groups) {
      console.error(`[Instrument] Invalid identifier format: "${identifier}"`);
      this.assetClass = AssetClass.UNKNOWN;
      this.underlyingIdentifier = identifier;
      this.baseSymbol = identifier;
      this.quoteCurrency = 'USD';
      this.productType = ProductType.UNKNOWN;
      return;
    }

    const { assetClass, underlying, market, quoteCurrency, productType } = match.groups;
    
    this.assetClass = assetClass as AssetClass;
    this.underlyingIdentifier = underlying;
    this.market = market;
    this.quoteCurrency = quoteCurrency;
    this.productType = productType as ProductType;

    // 解析 baseSymbol (用于数据源请求的 Ticker)
    // 对于股票，underlyingIdentifier 就是 ticker (如 600519.SS)
    // 对于期权/期货，underlyingIdentifier 可能是复合字符串 (如 BTC-20240101-C)
    const underlyingParts = this.underlyingIdentifier.split('-');

    if (
      this.assetClass === AssetClass.US_STOCK ||
      this.assetClass === AssetClass.HK_STOCK ||
      this.assetClass === AssetClass.CN_STOCK
    ) {
      // 股票类型：直接使用 underlyingIdentifier 作为 baseSymbol (包含 .SS, .HK 等后缀)
      this.baseSymbol = this.underlyingIdentifier;
    } else {
      // 加密货币/衍生品：通常第一部分是 base (如 BTC)
      this.baseSymbol = underlyingParts[0];
    }

    // 解析衍生品参数
    this._parseDerivativeDetails(underlyingParts);
  }

  private _parseDerivativeDetails(parts: string[]) {
    if (this.productType === ProductType.OPTION && parts.length >= 4) {
      try {
        // Format: BTC-20240101-50000-C
        const dateStr = parts[1]; // 240101 or 20240101 depending on feed
        // Assuming YYMMDD for now based on previous context, but standardizing to YYYY-MM-DD parsing is safer
        const year = dateStr.length === 6 ? `20${dateStr.slice(0, 2)}` : dateStr.slice(0, 4);
        const month = dateStr.length === 6 ? dateStr.slice(2, 4) : dateStr.slice(4, 6);
        const day = dateStr.length === 6 ? dateStr.slice(4, 6) : dateStr.slice(6, 8);
        
        this.expiry = new Date(`${year}-${month}-${day}`);
        this.strike = parseFloat(parts[2]);
        this.optionType = parts[3] as 'C' | 'P';
      } catch(e) { 
        console.error(`[Instrument] Failed to parse option details from "${this.underlyingIdentifier}"`);
      }
    }

    if (this.productType === ProductType.FUTURES && parts.length >= 2) {
      try {
        // Format: BTC-240101
        const dateStr = parts[1];
        const year = dateStr.length === 6 ? `20${dateStr.slice(0, 2)}` : dateStr.slice(0, 4);
        const month = dateStr.length === 6 ? dateStr.slice(2, 4) : dateStr.slice(4, 6);
        const day = dateStr.length === 6 ? dateStr.slice(4, 6) : dateStr.slice(6, 8);
        this.expiry = new Date(`${year}-${month}-${day}`);
      } catch(e) { 
        console.error(`[Instrument] Failed to parse futures expiry from "${this.underlyingIdentifier}"`);
      }
    }
  }

  public getDisplayName(): string {
    if (this.assetClass === AssetClass.PREDICTION) {
      const question = this.baseSymbol.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()) + '?';
      const outcome = this.productType.toString().replace('OUTCOME_', '');
      return `${question} ${outcome}`;
    }

    // --- A股和港股的显示优化 ---
    if (this.assetClass === AssetClass.CN_STOCK) {
      // 600519.SS -> 600519 (SH)
      // 000001.SZ -> 000001 (SZ)
      return `${this.baseSymbol.replace('.SS', ' (SH)').replace('.SZ', ' (SZ)')}`;
    }
    if (this.assetClass === AssetClass.HK_STOCK) {
      // 0700.HK -> 0700 (HK)
      return `${this.baseSymbol.replace('.HK', ' (HK)')}`;
    }

    switch(this.productType) {
      case ProductType.SPOT:
      case ProductType.PERP:
        // 股票通常只显示代码或公司名，不显示 /USD
        if (this.assetClass === AssetClass.US_STOCK) return this.baseSymbol;
        return `${this.baseSymbol}/${this.quoteCurrency}`;
        
      case ProductType.FUTURES:
        return `${this.baseSymbol}-${this.quoteCurrency} ${this.expiry ? this._formatExpiry(this.expiry) : ''}`;
        
      case ProductType.OPTION:
        return `${this.baseSymbol} ${this.strike} ${this.optionType === 'C' ? 'Call' : 'Put'} ${this.expiry ? this._formatExpiry(this.expiry) : ''}`;
        
      default:
        return this.underlyingIdentifier;
    }
  }

  private _formatExpiry(date: Date): string {
    return date.toLocaleDateString('en-CA', { month: 'short', day: '2-digit' });
  }

  /**
   * 获取用于数据源请求的 Ticker
   * 对于股票，这通常是 yfinance 兼容的 symbol (如 600519.SS)
   * 对于加密货币，这通常是交易所兼容的 symbol (如 BTC-USDT)
   */
  public getTicker(): string {
     if (this.assetClass === AssetClass.CRYPTO) {
        if (this.productType === ProductType.PERP) {
           return `${this.baseSymbol}-${this.quoteCurrency}-SWAP`;
        }
        return `${this.baseSymbol}-${this.quoteCurrency}`;
     }
     // 对于股票，直接返回包含后缀的 symbol
     return this.baseSymbol;
  }

  public toString(): string {
    return this.identifier;
  }
}
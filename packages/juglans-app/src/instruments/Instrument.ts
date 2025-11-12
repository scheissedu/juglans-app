// packages/juglans-app/src/instruments/Instrument.ts

import { AssetClass, ProductType } from './enums';

// This regex is the core of the parser. It uses named capture groups.
const INSTRUMENT_REGEX = /^(?<assetClass>[A-Z_]+):(?<underlying>[^.@]+)(?:\.(?<market>[A-Z]+))?@(?<quoteCurrency>[A-Z]+)_(?<productType>[A-Z]+)$/;

export class Instrument {
  public readonly identifier: string;
  public readonly assetClass: AssetClass;
  public readonly underlyingIdentifier: string;
  public readonly baseSymbol: string;
  public readonly market?: string;
  public readonly quoteCurrency: string;
  public readonly productType: ProductType;

  // Derivative-specific properties, parsed from the underlyingIdentifier
  public readonly expiry?: Date;
  public readonly strike?: number;
  public readonly optionType?: 'C' | 'P';

  constructor(identifier: string) {
    this.identifier = identifier;

    const match = identifier.match(INSTRUMENT_REGEX);

    if (!match || !match.groups) {
      console.error(`[Instrument] Invalid identifier format: "${identifier}"`);
      // Assign default/unknown values to prevent runtime errors
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

    // --- Parse the underlyingIdentifier for more details ---
    const underlyingParts = this.underlyingIdentifier.split('-');

    this.baseSymbol = underlyingParts[0];

    // Example parsing for Options: BTC-241227-80000-C
    if (this.productType === ProductType.OPTION && underlyingParts.length === 4) {
      try {
        const dateStr = underlyingParts[1];
        this.expiry = new Date(`20${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}-${dateStr.slice(4, 6)}`);
        this.strike = parseFloat(underlyingParts[2]);
        this.optionType = underlyingParts[3] as 'C' | 'P';
      } catch(e) { console.error(`[Instrument] Failed to parse option details from "${this.underlyingIdentifier}"`) }
    }

    // Example parsing for Futures: BTC-240927
    if (this.productType === ProductType.FUTURES && underlyingParts.length === 2) {
      try {
        const dateStr = underlyingParts[1];
        this.expiry = new Date(`20${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}-${dateStr.slice(4, 6)}`);
      } catch(e) { console.error(`[Instrument] Failed to parse futures expiry from "${this.underlyingIdentifier}"`) }
    }
  }

  /**
   * Returns a user-friendly display name, e.g., "BTC/USDT", "AAPL".
   */
  public getDisplayName(): string {
    switch(this.productType) {
      case ProductType.SPOT:
      case ProductType.PERP:
        return `${this.baseSymbol}/${this.quoteCurrency}`;
      case ProductType.FUTURES:
        return `${this.baseSymbol}-${this.quoteCurrency} ${this.expiry?.toLocaleDateString('en-CA', {month: 'short', day: '2-digit'}) || ''}`;
      case ProductType.OPTION:
        return `${this.baseSymbol} ${this.strike} ${this.optionType === 'C' ? 'Call' : 'Put'} (${this.expiry?.toLocaleDateString('en-CA') || ''})`;
      default:
        return this.underlyingIdentifier;
    }
  }

  /**
   * Returns the ticker used for datafeed requests (often without quote currency).
   */
  public getTicker(): string {
     // OKX and Binance use "BTC-USDT" for spot, "BTC-USDT-SWAP" for perp.
     // This part might need adjustment based on datafeed specifics.
     if (this.assetClass === AssetClass.CRYPTO) {
        if (this.productType === ProductType.PERP) {
           return `${this.baseSymbol}-${this.quoteCurrency}-SWAP`;
        }
        return `${this.baseSymbol}-${this.quoteCurrency}`;
     }
     // For stocks, it's usually just the base symbol
     return this.baseSymbol;
  }

  public toString(): string {
    return this.identifier;
  }
}
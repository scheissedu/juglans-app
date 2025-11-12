// packages/juglans-app/src/instruments/enums.ts

export enum AssetClass {
  CRYPTO = 'CRYPTO',
  US_STOCK = 'US_STOCK',
  HK_STOCK = 'HK_STOCK',
  PREDICTION = 'PREDICTION', // For future use
  UNKNOWN = 'UNKNOWN',
}

export enum ProductType {
  SPOT = 'SPOT',
  PERP = 'PERP',
  FUTURES = 'FUTURES',
  OPTION = 'OPTION',
  BINARY = 'BINARY', // For future use
  UNKNOWN = 'UNKNOWN',
}
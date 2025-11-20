// packages/juglans-app/src/instruments/enums.ts

export enum AssetClass {
  CRYPTO = 'CRYPTO',
  US_STOCK = 'US_STOCK',
  HK_STOCK = 'HK_STOCK', // 新增：港股
  CN_STOCK = 'CN_STOCK', // 新增：A股
  PREDICTION = 'PREDICTION',
  UNKNOWN = 'UNKNOWN',
}

export enum ProductType {
  SPOT = 'SPOT',
  PERP = 'PERP',
  FUTURES = 'FUTURES',
  OPTION = 'OPTION',
  BINARY = 'BINARY', 
  UNKNOWN = 'UNKNOWN',
}
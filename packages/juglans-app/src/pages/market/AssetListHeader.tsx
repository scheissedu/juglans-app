// packages/juglans-app/src/pages/market/AssetListHeader.tsx
import { Component } from 'solid-js';
import '../MarketPage.css';

const AssetListHeader: Component = () => {
  return (
    <div class="asset-list-header">
      <span class="header-asset">Asset</span>
      <span class="header-chart">Chart</span>
      <span class="header-volume">24h Volume</span>
      <span class="header-price">Price</span>
    </div>
  );
};

export default AssetListHeader;
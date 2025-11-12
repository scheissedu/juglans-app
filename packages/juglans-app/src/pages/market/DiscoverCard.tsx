// packages/juglans-app/src/pages/market/DiscoverCard.tsx
import { Component, Show } from 'solid-js';
import { SymbolInfo } from '@klinecharts/pro';
import { TickerData } from '@/types';
import AssetIcon from '@/components/icons/AssetIcon';
import './Discover.css';

export interface DiscoverAsset {
  symbol: SymbolInfo;
  ticker: TickerData;
}

interface DiscoverCardProps {
  asset: DiscoverAsset;
  onClick: (symbol: SymbolInfo) => void;
}

const DiscoverCard: Component<DiscoverCardProps> = (props) => {
  const changePercent = () => props.asset.ticker.priceChangePercent ?? 0;
  const baseSymbol = () => (props.asset.symbol.shortName ?? props.asset.symbol.ticker).split('-')[0];
  const assetType = () => (props.asset.symbol.market === 'stocks' ? 'stock' : 'crypto');

  return (
    <div class="discover-card" onClick={() => props.onClick(props.asset.symbol)}>
      <div class="card-asset-info">
        <AssetIcon symbol={baseSymbol()} assetType={assetType()} />
        <span class="card-asset-ticker">{props.asset.symbol.ticker}</span>
      </div>
      <div class="card-asset-price">${props.asset.ticker.lastPrice.toFixed(2)}</div>
      <div class={`card-asset-change ${changePercent() >= 0 ? 'up' : 'down'}`}>
        {(changePercent() * 100).toFixed(2)}%
      </div>
    </div>
  );
};

export default DiscoverCard;
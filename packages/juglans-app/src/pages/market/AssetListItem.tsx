// packages/juglans-app/src/pages/market/AssetListItem.tsx
import { Component, Show } from 'solid-js';
import { TickerData } from '@/types';
import { Instrument } from '@/instruments';
import '../MarketPage.css';
import AssetIcon from '@/components/icons/AssetIcon';
import StarIcon from '@/components/icons/StarIcon';

interface AssetListItemProps {
  instrument: Instrument;
  ticker?: TickerData;
  onClick: (instrument: Instrument) => void;
  isWatched: boolean;
  onWatchlistToggle: (event: MouseEvent) => void;
  variant?: 'list' | 'widget';
}

const formatMarketValue = (value: number | undefined) => {
  if (value === undefined || value === null) return '--';
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};


const AssetListItem: Component<AssetListItemProps> = (props) => {
  const variant = () => props.variant ?? 'list';

  const lastPrice = () => props.ticker?.lastPrice;
  const changePercent = () => props.ticker?.priceChangePercent ?? 0;
  
  const assetType = () => {
    const assetClassStr = props.instrument.assetClass.toString();
    if (assetClassStr.includes('STOCK')) return 'stock';
    return 'crypto';
  };

  return (
    <div 
      class="asset-list-item" 
      classList={{ 'variant-widget': variant() === 'widget' }}
      onClick={() => props.onClick(props.instrument)}
    >
      <div class="asset-info">
        <AssetIcon symbol={props.instrument.baseSymbol} assetType={assetType()} />
        <div class="asset-names">
          <div class="asset-short-name">{props.instrument.baseSymbol}</div>
          <Show when={variant() === 'list'}>
            <div class="asset-long-name">{props.instrument.getDisplayName()}</div>
          </Show>
        </div>
      </div>
      
      <Show when={variant() === 'list'}>
        <div class="mini-chart-placeholder">
          <svg viewBox="0 0 100 30" class="sparkline">
              <path d="M0,15 L10,20 L20,10 L30,18 L40,12 L50,22 L60,15 L70,10 L80,25 L90,18 L100,15" fill="none" stroke={changePercent() >= 0 ? '#2DC08E' : '#F92855'} stroke-width="2"/>
          </svg>
        </div>
      </Show>

      <Show when={variant() === 'list'}>
        <div class="asset-market-info">
          <div class="asset-market-value">{formatMarketValue(props.ticker?.turnover)}</div>
        </div>
      </Show>

      <div class="asset-price-info">
        <Show when={lastPrice() !== undefined} fallback={<div class="asset-last-price">--</div>}>
          <div class="asset-last-price">
            {variant() === 'list' ? '$' : ''}{lastPrice()!.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </Show>
        <Show when={props.ticker}>
          <div class={`asset-change ${changePercent() >= 0 ? 'up' : 'down'}`}>
            {`${changePercent() >= 0 ? '+' : ''}${(changePercent() * 100).toFixed(2)}%`}
          </div>
        </Show>
      </div>

      <Show when={variant() === 'list'}>
        <div class="asset-watchlist-action">
          <button class="watchlist-btn" classList={{ 'is-watched': props.isWatched }} onClick={props.onWatchlistToggle}>
            <StarIcon isFilled={props.isWatched} />
          </button>
        </div>
      </Show>
    </div>
  );
};

export default AssetListItem;
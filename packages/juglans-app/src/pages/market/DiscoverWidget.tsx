// packages/juglans-app/src/pages/market/DiscoverWidget.tsx
import { Component, For, Show } from 'solid-js';
import { SymbolInfo } from '@klinecharts/pro';
import AssetListItem from './AssetListItem';
import { TickerData } from '@/types';
import { useAppContext } from '@/context/AppContext';
import './DiscoverWidget.css';

export interface DiscoverAsset {
  symbol: SymbolInfo;
  ticker: TickerData;
}

interface DiscoverWidgetProps {
  title: string;
  assets: DiscoverAsset[];
  onItemClick: (symbol: SymbolInfo) => void;
}

const DiscoverWidget: Component<DiscoverWidgetProps> = (props) => {
  const [state, actions] = useAppContext();

  return (
    <div class="discover-widget">
      <div class="widget-header">
        <h2 class="widget-title">{props.title}</h2>
      </div>
      <div class="widget-list">
        <Show when={props.assets.length > 0} fallback={<div class="widget-empty">No data to display</div>}>
          <For each={props.assets.slice(0, 5)} keyed={(asset) => asset.symbol.ticker}>
            {(asset) => (
              <AssetListItem
                symbol={asset.symbol}
                ticker={asset.ticker}
                onClick={props.onItemClick}
                isWatched={state.watchlist.includes(asset.symbol.ticker)}
                onWatchlistToggle={(e) => {
                  e.stopPropagation();
                  actions.toggleWatchlist(asset.symbol.ticker);
                }}
                variant="widget"
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default DiscoverWidget;
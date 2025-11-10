// packages/juglans-app/src/pages/market/AssetList.tsx
import { Component, For, Show } from 'solid-js';
import { SymbolInfo } from '@klinecharts/pro';
import AssetListItem from './AssetListItem';
import { Loading, Empty } from '@klinecharts/pro';
import { TickerData } from '../../types';

interface AssetListProps {
  symbols: SymbolInfo[];
  tickers: Record<string, TickerData>;
  loading: boolean;
  onItemClick: (symbol: SymbolInfo) => void;
}

const AssetList: Component<AssetListProps> = (props) => {
  return (
    <div class="asset-list-container">
      <Show when={!props.loading} fallback={<Loading />}>
        {/* 关键修改：增加对 symbols 数组是否为空的判断 */}
        <Show when={props.symbols.length > 0} fallback={<Empty />}>
          <For each={props.symbols}>
            {(symbol) => (
              <AssetListItem 
                symbol={symbol}
                ticker={props.tickers[symbol.ticker]}
                onClick={props.onItemClick}
              />
            )}
          </For>
        </Show>
      </Show>
    </div>
  );
};

export default AssetList;
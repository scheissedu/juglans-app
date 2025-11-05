// packages/juglans-app/src/pages/market/AssetList.tsx (更新)

import { Component, For, Show } from 'solid-js';
import { SymbolInfo } from '@klinecharts/pro';
import AssetListItem from './AssetListItem';
import { Loading, Empty } from '@klinecharts/pro';
import { TickerData } from '../../types';

interface AssetListProps {
  symbols: SymbolInfo[];
  tickers: Record<string, TickerData>; // 接收 tickers store
  loading: boolean;
  onItemClick: (symbol: SymbolInfo) => void;
}

const AssetList: Component<AssetListProps> = (props) => {
  return (
    <div class="asset-list-container">
      <Show when={!props.loading} fallback={<Loading />}>
        <Show when={props.symbols.length > 0} fallback={<Empty />}>
          <For each={props.symbols}>
            {(symbol) => (
              <AssetListItem 
                symbol={symbol}
                ticker={props.tickers[symbol.ticker]} // 将对应的 ticker 数据传递给子组件
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
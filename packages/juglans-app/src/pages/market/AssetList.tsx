// packages/juglans-app/src/pages/market/AssetList.tsx
import { Component, For, Show } from 'solid-js';
import AssetListItem from './AssetListItem';
import AssetListHeader from './AssetListHeader';
import { Loading, Empty } from '@klinecharts/pro';
import { TickerData } from '../../types';
import { useAppContext } from '@/context/AppContext';
import { Instrument } from '@/instruments';

interface AssetListProps {
  instruments: Instrument[];
  tickers: Record<string, TickerData>;
  loading: boolean;
  onItemClick: (instrument: Instrument) => void;
}

const AssetList: Component<AssetListProps> = (props) => {
  const [state, actions] = useAppContext();

  return (
    <div class="asset-list-container">
      <Show when={!props.loading} fallback={<Loading />}>
        <Show when={props.instruments.length > 0} fallback={<Empty />}>
          <AssetListHeader />
          <For each={props.instruments}>
            {(instrument) => (
              <AssetListItem 
                instrument={instrument}
                ticker={props.tickers[instrument.getTicker()]}
                onClick={props.onItemClick}
                isWatched={state.watchlist.includes(instrument.getTicker())}
                onWatchlistToggle={(e) => {
                  e.stopPropagation();
                  actions.toggleWatchlist(instrument.getTicker());
                }}
              />
            )}
          </For>
        </Show>
      </Show>
    </div>
  );
};

export default AssetList;
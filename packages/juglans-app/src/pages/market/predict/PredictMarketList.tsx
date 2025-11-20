// packages/juglans-app/src/pages/market/predict/PredictMarketList.tsx
import { Component, For, Show } from 'solid-js';
import PredictMarketListItem from './PredictMarketListItem';
import { Loading } from '@klinecharts/pro';
// --- 核心修改 1: 导入我们自己的 EmptyState ---
import EmptyState from '@/components/common/EmptyState';
import '../../MarketPage.css';

interface PredictMarketListProps {
  events: any[]; 
  loading: boolean;
}

const PredictMarketList: Component<PredictMarketListProps> = (props) => {
  return (
    <div class="predict-event-list">
      <Show when={!props.loading} fallback={<Loading />}>
        {/* --- 核心修改 2: 使用 EmptyState 替代 Empty --- */}
        <Show 
          when={props.events.length > 0} 
          fallback={<EmptyState message="No Markets Found" subMessage="Try selecting a different category." />}
        >
          <For each={props.events}>
            {(event) => <PredictMarketListItem event={event} />}
          </For>
        </Show>
      </Show>
    </div>
  );
};

export default PredictMarketList;
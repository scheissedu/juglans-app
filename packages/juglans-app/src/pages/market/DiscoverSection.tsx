// packages/juglans-app/src/pages/market/DiscoverSection.tsx
import { Component, For, Show } from 'solid-js';
import { SymbolInfo } from '@klinecharts/pro';
import DiscoverCard, { DiscoverAsset } from './DiscoverCard';
import './Discover.css';

interface DiscoverSectionProps {
  title: string;
  assets: DiscoverAsset[];
  onCardClick: (symbol: SymbolInfo) => void;
}

const DiscoverSection: Component<DiscoverSectionProps> = (props) => {
  return (
    <div class="discover-section">
      <h2 class="discover-title">{props.title}</h2>
      <div class="discover-scroll-container">
        <Show when={props.assets.length > 0} fallback={<div class="discover-empty">No data available</div>}>
          {/* --- 核心修复：添加 keyed 属性，使用唯一的 ticker 作为 key --- */}
          <For each={props.assets} keyed={(asset) => asset.symbol.ticker}>
            {(asset) => (
              <DiscoverCard asset={asset} onClick={props.onCardClick} />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default DiscoverSection;
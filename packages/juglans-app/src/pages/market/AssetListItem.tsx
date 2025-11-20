// packages/juglans-app/src/pages/market/AssetListItem.tsx
import { Component, Show, createResource } from 'solid-js';
import { TickerData } from '@/types';
import { Instrument } from '@/instruments';
import '../MarketPage.css';
import AssetIcon from '@/components/icons/AssetIcon';
import StarIcon from '@/components/icons/StarIcon';
import Sparkline from '@/components/common/Sparkline';
import UnifiedDatafeed from '@/api/datafeed/UnifiedDatafeed';

const datafeed = new UnifiedDatafeed();

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
  // 获取处理过默认值的 variant
  const variant = () => props.variant ?? 'list';
  
  const lastPrice = () => props.ticker?.lastPrice;
  const changePercent = () => props.ticker?.priceChangePercent ?? 0;
  
  const assetType = () => {
    const assetClassStr = props.instrument.assetClass.toString();
    if (assetClassStr.includes('STOCK')) return 'stock';
    return 'crypto';
  };

  const trendColor = () => changePercent() >= 0 ? '#2DC08E' : '#F92855';

  // --- 核心修复：使用 variant() 函数而不是 props.variant ---
  const [sparklineData] = createResource(
    () => {
      // 1. 必须是列表模式 (variant() 会返回 'list' 默认值)
      // 2. 必须是股票类型 (加密货币暂时不请求)
      if (variant() === 'list' && assetType() === 'stock') {
        return props.instrument.baseSymbol;
      }
      return null;
    },
    async (symbol) => {
      if (!symbol) return [];
      // 添加一点随机延迟，避免并发请求过多导致浏览器阻塞
      await new Promise(r => setTimeout(r, Math.random() * 500)); 
      return datafeed.getSparklineData(symbol);
    }
  );

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
          <Show 
            when={!sparklineData.loading && sparklineData() && sparklineData()!.length > 0}
            fallback={
               // 加载中的占位符
               <div style={{ width: '100%', height: '2px', "background-color": "var(--border-color)", opacity: 0.3 }} />
            }
          >
            {/* Sparkline 容器 */}
            <div style={{ width: '100%', height: '100%', "padding": "2px 0" }}>
              <Sparkline 
                data={sparklineData()!} 
                color={trendColor()} 
                strokeWidth={2}
              />
            </div>
          </Show>
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
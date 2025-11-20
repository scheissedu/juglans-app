// packages/juglans-app/src/pages/market/predict/PredictMarketListItem.tsx

import { Component, createResource, Show, For, createMemo, createSignal, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import CrystalBallIcon from '@/components/icons/CrystalBallIcon';
import PredictDatafeed from '@/api/datafeed/PredictDatafeed';
import '../../MarketPage.css';

const datafeed = new PredictDatafeed();

// 环形进度条组件
const ProgressCircle: Component<{ percentage: number }> = (props) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = createMemo(() => circumference - (props.percentage / 100) * circumference);

  return (
    <div class="progress-circle-container">
      <svg class="progress-circle-svg" viewBox="0 0 80 80">
        <circle class="progress-bg" cx="40" cy="40" r={radius} />
        <circle
          class="progress-fg"
          cx="40"
          cy="40"
          r={radius}
          stroke-dasharray={circumference}
          stroke-dashoffset={offset()}
        />
      </svg>
      <div class="progress-text-content">
        <span class="progress-text">{props.percentage}%</span>
        <span class="progress-label">chance</span>
      </div>
    </div>
  );
};

interface Market {
  ticker: string;
  yes_sub_title: string;
  last_price: number;
  volume: number;
}

interface PredictMarketListItemProps {
  event: {
    event_ticker: string;
    title: string;
    series_ticker: string;
    category: string;
    markets: Market[]; 
  };
}

const PredictMarketListItem: Component<PredictMarketListItemProps> = (props) => {
  const navigate = useNavigate();
  
  let cardRef: HTMLDivElement | undefined;
  const [isVisible, setIsVisible] = createSignal(false);

  // 只有当卡片进入视口，isVisible 变为 true 时，createResource 才会被触发
  const [metadata] = createResource(() => isVisible() && props.event.event_ticker, datafeed.getEventMetadata);

  onMount(() => {
    // 使用 IntersectionObserver 监听卡片是否进入视口
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          // 触发加载后即可停止观察，以节省资源
          if (cardRef) observer.unobserve(cardRef);
        }
      },
      { 
        // 优化：当卡片距离视口底部 200px 时就开始加载
        rootMargin: "0px 0px 200px 0px" 
      }
    );

    if (cardRef) {
      observer.observe(cardRef);
    }
  });

  const isSingleMarket = createMemo(() => props.event.markets?.length === 1);
  const singleMarket = createMemo(() => isSingleMarket() ? props.event.markets[0] : null);

  const topTwoMarkets = createMemo(() => {
    if (isSingleMarket() || !props.event.markets) return [];
    return [...props.event.markets]
      .sort((a, b) => b.last_price - a.last_price)
      .slice(0, 2);
  });

  const totalVolume = createMemo(() => {
    const vol = props.event.markets?.reduce((sum, market) => sum + (market.volume || 0), 0);
    if (!vol) return '$0 Vol.';
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}m Vol.`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}k Vol.`;
    return `$${vol.toLocaleString()} Vol.`;
  });

  const navigateToMarket = (ticker: string) => {
    if (ticker) navigate(`/predict-market/${ticker}`);
  };

  return (
    <div ref={cardRef} class="predict-event-card" classList={{ 'single-market': isSingleMarket() }}>
      <div class="predict-card-header" onClick={() => navigateToMarket(singleMarket()?.ticker || props.event.markets?.[0]?.ticker)}>
        <div class="predict-card-image">
          <Show 
            when={isVisible() && !metadata.loading && metadata()?.image_url}
            fallback={<CrystalBallIcon />}
          >
            <img src={metadata()!.image_url} alt={props.event.title} />
          </Show>
        </div>
        <h3 class="predict-card-title">{props.event.title}</h3>
      </div>

      <div class="predict-card-body">
        <Show 
          when={isSingleMarket() && singleMarket()}
          fallback={
            <For each={topTwoMarkets()}>
              {(market) => (
                <div class="predict-market-row">
                  <span class="market-subtitle">{market.yes_sub_title}</span>
                  <span class="market-price">{market.last_price}%</span>
                  <div class="market-actions">
                    <button class="yes-btn" onClick={() => navigateToMarket(market.ticker)}>Yes</button>
                    <button class="no-btn" onClick={() => navigateToMarket(market.ticker)}>No</button>
                  </div>
                </div>
              )}
            </For>
          }
        >
          {(market) => (
            <div class="single-market-body">
              <ProgressCircle percentage={market().last_price} />
              <div class="stacked-action-buttons">
                <button class="stacked-action-btn yes" onClick={() => navigateToMarket(market().ticker)}>Yes</button>
                <button class="stacked-action-btn no" onClick={() => navigateToMarket(market().ticker)}>No</button>
              </div>
            </div>
          )}
        </Show>
      </div>

      <div class="predict-card-footer">
        <span class="footer-volume">{totalVolume()}</span>
        <div class="footer-actions"></div>
      </div>
    </div>
  );
};

export default PredictMarketListItem;
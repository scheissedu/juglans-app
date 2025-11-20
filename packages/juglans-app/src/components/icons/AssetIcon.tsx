// packages/juglans-app/src/components/icons/AssetIcon.tsx
import { Component, createSignal, Show, on, createEffect, createMemo } from 'solid-js';
import '@/pages/MarketPage.css';

const CRYPTO_ICON_BASE_URL = 'https://raw.githubusercontent.com/nvstly/icons/main/crypto_icons/';
const US_STOCK_ICON_BASE_URL = 'https://raw.githubusercontent.com/nvstly/icons/main/ticker_icons/';
const FMP_ICON_BASE_URL = 'https://financialmodelingprep.com/image-stock/';

const iconCache = new Map<string, 'loading' | 'error' | string>();

interface AssetIconProps {
  symbol: string;
  assetType?: 'crypto' | 'stock';
}

const AssetIcon: Component<AssetIconProps> = (props) => {
  const [source, setSource] = createSignal<string | 'error' | 'loading'>('loading');
  
  const assetSymbol = () => props.symbol.toUpperCase();
  const type = () => props.assetType ?? 'crypto';

  const imageUrl = createMemo(() => {
    const sym = assetSymbol();
    
    if (type() === 'stock') {
      // 核心逻辑：如果是 A股 (.SS/.SZ) 或 港股 (.HK)，使用 FMP 数据源
      if (sym.endsWith('.SS') || sym.endsWith('.SZ') || sym.endsWith('.HK')) {
        return `${FMP_ICON_BASE_URL}${sym}.png`;
      }
      // 美股及其他默认使用 nvstly 源
      return `${US_STOCK_ICON_BASE_URL}${sym}.png`;
    }
    
    // 加密货币
    return `${CRYPTO_ICON_BASE_URL}${sym}.png`;
  });

  createEffect(on(() => imageUrl(), (url) => {
    const cachedStatus = iconCache.get(url);

    if (cachedStatus && cachedStatus !== 'loading') {
      setSource(cachedStatus);
      return;
    }

    setSource('loading');
    iconCache.set(url, 'loading');

    const img = new Image();
    img.onload = () => {
      iconCache.set(url, url);
      if (imageUrl() === url) setSource(url);
    };
    img.onerror = () => {
      iconCache.set(url, 'error');
      if (imageUrl() === url) setSource('error');
    };
    img.src = url;
  }));

  return (
    <div class="crypto-icon-container">
      <Show
        when={source() === 'loading' || source() === 'error'}
        fallback={
          <img
            src={source() as string}
            alt={`${assetSymbol()} logo`}
            class="crypto-icon-image"
          />
        }
      >
        <div class="asset-icon-placeholder-fallback">
          {assetSymbol().charAt(0)}
        </div>
      </Show>
    </div>
  );
};

export default AssetIcon;
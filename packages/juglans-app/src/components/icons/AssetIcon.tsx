import { Component, createSignal, Show, createEffect } from 'solid-js';
import '@/pages/MarketPage.css'; // 复用样式

const CDN_URL_PREFIX = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/';

interface AssetIconProps {
  symbol: string;
  assetType?: 'crypto' | 'stock'; // 资产类型，默认为 'crypto'
}

const AssetIcon: Component<AssetIconProps> = (props) => {
  const [imgSrc, setImgSrc] = createSignal('');
  const [hasError, setHasError] = createSignal(false);
  const [fallbackAttempted, setFallbackAttempted] = createSignal(false);

  const assetSymbol = () => props.symbol.toUpperCase();
  const type = () => props.assetType ?? 'crypto';

  // 核心逻辑：根据 props 构建初始的图片 URL
  createEffect(() => {
    setHasError(false);
    setFallbackAttempted(false);
    if (type() === 'stock') {
      setImgSrc(`/ticker_icons/${assetSymbol()}.png`);
    } else { // crypto
      setImgSrc(`/crypto_icons/${assetSymbol()}.png`);
    }
  });

  // 错误处理与回退逻辑
  const handleError = () => {
    // 如果是加密货币且本地 PNG 失败，尝试回退到 CDN 的 SVG
    if (type() === 'crypto' && !fallbackAttempted()) {
      setFallbackAttempted(true);
      setImgSrc(`${CDN_URL_PREFIX}${props.symbol.toLowerCase()}.svg`);
    } else {
      // 如果是股票，或加密货币的 CDN 也失败了，则触发最终的错误状态
      setHasError(true);
    }
  };

  return (
    <div class="crypto-icon-container">
      <Show
        when={!hasError()}
        fallback={
          <div class="asset-icon-placeholder-fallback">
            {assetSymbol().charAt(0)}
          </div>
        }
      >
        <img
          src={imgSrc()}
          alt={`${assetSymbol()} logo`}
          class="crypto-icon-image"
          onError={handleError}
        />
      </Show>
    </div>
  );
};

export default AssetIcon;
import { Component, createSignal, Show, createEffect } from 'solid-js';
// +++ 核心修正：使用路径别名 @ 来正确引用 CSS 文件 +++
import '@/pages/MarketPage.css'; 

interface CryptoIconProps {
  symbol: string; 
}

const CDN_URL_PREFIX = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/';

const CryptoIcon: Component<CryptoIconProps> = (props) => {
  const [imageVisible, setImageVisible] = createSignal(true);

  const iconUrl = () => `${CDN_URL_PREFIX}${props.symbol.toLowerCase()}.svg`;

  const handleError = () => {
    setImageVisible(false);
  };

  createEffect(() => {
    props.symbol; 
    setImageVisible(true);
  });

  return (
    <div class="crypto-icon-container">
      <Show
        when={imageVisible()}
        fallback={
          <div class="asset-icon-placeholder-fallback">
            {props.symbol.charAt(0).toUpperCase()}
          </div>
        }
      >
        <img
          src={iconUrl()}
          alt={`${props.symbol} logo`}
          class="crypto-icon-image"
          onError={handleError}
        />
      </Show>
    </div>
  );
};

export default CryptoIcon;
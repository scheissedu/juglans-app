// packages/juglans-app/src/components/icons/AssetIcon.tsx
import { Component, createSignal, Show, on, createEffect, createMemo } from 'solid-js';
import '@/pages/MarketPage.css';

// 1. 定义图标仓库的基础 URL
const CRYPTO_ICON_BASE_URL = 'https://raw.githubusercontent.com/nvstly/icons/main/crypto_icons/';
const STOCK_ICON_BASE_URL = 'https://raw.githubusercontent.com/nvstly/icons/main/stock_icons/';

// 全局缓存，避免重复的网络请求
const iconCache = new Map<string, 'loading' | 'error' | string>();

interface AssetIconProps {
  symbol: string;
  assetType?: 'crypto' | 'stock';
}

const AssetIcon: Component<AssetIconProps> = (props) => {
  const [source, setSource] = createSignal<string | 'error' | 'loading'>('loading');
  
  const assetSymbol = () => props.symbol.toUpperCase();
  const type = () => props.assetType ?? 'crypto';

  // 2. 使用 createMemo 动态构建完整的图标 URL
  const imageUrl = createMemo(() => {
    if (type() === 'stock') {
      return `${STOCK_ICON_BASE_URL}${assetSymbol()}.png`;
    }
    // 默认是 crypto
    return `${CRYPTO_ICON_BASE_URL}${assetSymbol()}.png`;
  });

  createEffect(on(() => imageUrl(), (url) => {
    // 每次 URL 变化时（即 symbol 或 type 变化时），执行此逻辑
    const cachedStatus = iconCache.get(url);

    if (cachedStatus && cachedStatus !== 'loading') {
      setSource(cachedStatus);
      return;
    }

    setSource('loading');
    iconCache.set(url, 'loading');

    // 预加载图片
    const img = new Image();
    img.onload = () => {
      iconCache.set(url, url); // 缓存成功的 URL
      // 检查当前组件是否仍在等待这个 URL 的结果
      if (imageUrl() === url) {
        setSource(url);
      }
    };
    img.onerror = () => {
      iconCache.set(url, 'error'); // 缓存错误状态
      if (imageUrl() === url) {
        setSource('error');
      }
    };
    img.src = url; // 触发加载
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
          {/* 在加载中或失败时显示首字母 */}
          {assetSymbol().charAt(0)}
        </div>
      </Show>
    </div>
  );
};

export default AssetIcon;
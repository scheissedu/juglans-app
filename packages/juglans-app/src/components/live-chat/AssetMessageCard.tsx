// packages/juglans-app/src/components/live-chat/AssetMessageCard.tsx
import { Component, createResource, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import AssetIcon from '../icons/AssetIcon';
import UnifiedDatafeed from '@/api/datafeed/UnifiedDatafeed';
import { TickerData } from '@/types';

const datafeed = new UnifiedDatafeed();

interface AssetMessageCardProps {
  symbol: string;
  assetType: 'stock' | 'crypto';
}

const AssetMessageCard: Component<AssetMessageCardProps> = (props) => {
  const navigate = useNavigate();

  // 实时获取行情数据
  const [ticker] = createResource(async () => {
    try {
      if (props.assetType === 'stock') {
        const data = await datafeed.getStockTickers([props.symbol]);
        return data[props.symbol];
      } else {
        // 尝试获取加密货币数据
        const tickers = await datafeed.getOkxTickers();
        // 简单的模糊匹配
        return tickers.find(t => t.symbol.startsWith(props.symbol));
      }
    } catch (e) {
      console.error("Failed to load ticker for card:", e);
      return null;
    }
  });

  const handleClick = () => {
    // 构建跳转链接
    const identifier = props.assetType === 'stock' 
      ? `US_STOCK:${props.symbol}.NASDAQ@USD_SPOT`
      : `CRYPTO:${props.symbol}.OKX@USDT_SPOT`; 
      
    navigate(`/market/${encodeURIComponent(identifier)}`);
  };

  const formatPercent = (val: number | undefined) => {
    if (val === undefined || val === null) return '0.00';
    return (val * 100).toFixed(2);
  };

  return (
    <div 
      onClick={handleClick}
      style={{
        "display": "flex",
        "align-items": "center",
        "gap": "12px",
        "background-color": "rgba(255,255,255,0.08)",
        "border": "1px solid var(--border-color)",
        "border-radius": "12px",
        "padding": "12px",
        "margin-top": "4px",
        "cursor": "pointer",
        "min-width": "220px",
        "transition": "background-color 0.2s"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
    >
      <div style={{width: "40px", height: "40px", "flex-shrink": "0"}}>
        <AssetIcon symbol={props.symbol} assetType={props.assetType} />
      </div>
      
      <div style={{ "flex": "1", "display": "flex", "flex-direction": "column", "justify-content": "center" }}>
        <div style={{ "font-weight": "700", "font-size": "15px", "color": "#fff" }}>{props.symbol}</div>
        <div style={{ "font-size": "12px", "color": "var(--light-gray)", "text-transform": "uppercase" }}>{props.assetType}</div>
      </div>

      <Show when={!ticker.loading && ticker()} fallback={<span style={{color: "var(--light-gray)", "font-size": "12px"}}>...</span>}>
        {(t: TickerData) => (
          <div style={{ "text-align": "right" }}>
            <div style={{ "font-weight": "600", "font-size": "15px", "color": "#fff", "font-family": "monospace" }}>
              {/* --- 核心修复：增加可选链和默认值 --- */}
              ${t.lastPrice?.toFixed(2) ?? '--'}
            </div>
            <div 
              style={{ 
                "font-size": "12px", 
                "font-weight": "500",
                "color": (t.priceChangePercent ?? 0) >= 0 ? "#2DC08E" : "#F92855",
                "font-family": "monospace"
              }}
            >
              {/* --- 核心修复：增加安全检查 --- */}
              {(t.priceChangePercent ?? 0) >= 0 ? '+' : ''}{formatPercent(t.priceChangePercent)}%
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};

export default AssetMessageCard;
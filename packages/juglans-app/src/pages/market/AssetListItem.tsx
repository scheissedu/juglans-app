import { Component, Show } from 'solid-js';
import { SymbolInfo } from '@klinecharts/pro';
import { TickerData } from '@/types';
import '../MarketPage.css';
// +++ 核心修正：将 'icon' 修改为 'icons' +++
import CryptoIcon from '@/components/icons/CryptoIcon'; 

interface AssetListItemProps {
  symbol: SymbolInfo;
  ticker?: TickerData;
  onClick: (symbol: SymbolInfo) => void;
}

const AssetListItem: Component<AssetListItemProps> = (props) => {
  const lastPrice = () => props.ticker?.lastPrice ?? 0;
  const changePercent = () => props.ticker?.priceChangePercent ?? 0;

  const baseSymbol = () => (props.symbol.shortName ?? props.symbol.ticker).split('-')[0];

  return (
    <div class="asset-list-item" onClick={() => props.onClick(props.symbol)}>
      <div class="asset-info">
        <CryptoIcon symbol={baseSymbol()} />
        <div class="asset-names">
          <div class="asset-short-name">{props.symbol.shortName ?? props.symbol.ticker}</div>
          <div class="asset-long-name">{props.symbol.name}</div>
        </div>
      </div>
      
      <div class="mini-chart-placeholder">
        <svg viewBox="0 0 100 30" class="sparkline">
            <path d="M0,15 L10,20 L20,10 L30,18 L40,12 L50,22 L60,15 L70,10 L80,25 L90,18 L100,15" fill="none" stroke={changePercent() >= 0 ? '#2DC08E' : '#F92855'} stroke-width="2"/>
        </svg>
      </div>

      <div class="asset-price-info">
        <Show when={lastPrice() > 0} fallback={<div class="asset-last-price">--</div>}>
          <div class="asset-last-price">${lastPrice().toFixed(2)}</div>
        </Show>
        <div class={`asset-change ${changePercent() * 100 >= 0 ? 'up' : 'down'}`}>
          {(changePercent() * 100).toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default AssetListItem;
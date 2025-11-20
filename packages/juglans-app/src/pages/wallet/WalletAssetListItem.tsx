// packages/juglans-app/src/pages/wallet/WalletAssetListItem.tsx
import { Component, Show } from 'solid-js';
import AssetIcon from '../../components/icons/AssetIcon';
import { AggregatedAsset } from './WalletAssetList';
import './Wallet.css';

interface WalletAssetListItemProps {
  asset: AggregatedAsset;
  viewMode: 'list' | 'card'; // 新增
  onSend: (symbol: string) => void;
  onReceive: (symbol: string) => void;
}

const WalletAssetListItem: Component<WalletAssetListItemProps> = (props) => {
  const quantityDecimalPlaces = () => props.asset.assetType === 'stock' ? 2 : 6;

  // --- CARD VIEW 渲染逻辑 ---
  if (props.viewMode === 'card') {
    return (
      <div class="asset-card">
        <div class="asset-card-header">
          <div class="card-icon-wrapper">
            <AssetIcon symbol={props.asset.symbol} assetType={props.asset.assetType} />
          </div>
          <div class="card-asset-info">
            <span class="card-symbol">{props.asset.symbol}</span>
            <span class="card-type">{props.asset.assetType}</span>
          </div>
        </div>

        <div class="card-balance-row">
          <div class="card-amount">
            {props.asset.balance.total.toFixed(quantityDecimalPlaces())} {props.asset.symbol}
          </div>
          <div class="card-value-usd">
            ≈ ${props.asset.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div class="card-actions">
          <button class="card-action-btn primary" onClick={() => props.onSend(props.asset.symbol)}>
            Send
          </button>
          <button class="card-action-btn" onClick={() => props.onReceive(props.asset.symbol)}>
            Receive
          </button>
        </div>
      </div>
    );
  }

  // --- LIST VIEW 渲染逻辑 (原样保留) ---
  return (
    <div class="wallet-asset-item">
      <div class="asset-info">
        <AssetIcon symbol={props.asset.symbol} assetType={props.asset.assetType} />
        <div class="asset-names">
          <div class="asset-short-name">{props.asset.symbol}</div>
        </div>
      </div>
      
      <div class="asset-balance">
        <div class="asset-amount">{props.asset.balance.total.toFixed(quantityDecimalPlaces())}</div>
        <div class="asset-usd-value">~${props.asset.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      <div class="asset-available">
        {props.asset.balance.free.toFixed(quantityDecimalPlaces())}
      </div>

      <div class="asset-actions">
        <button onClick={() => props.onSend(props.asset.symbol)}>Send</button>
        <button onClick={() => props.onReceive(props.asset.symbol)}>Receive</button>
      </div>
    </div>
  );
};

export default WalletAssetListItem;
// packages/juglans-app/src/pages/wallet/WalletAssetListItem.tsx
import { Component } from 'solid-js';
import AssetIcon from '../../components/icons/AssetIcon';
import { AggregatedAsset } from './WalletAssetList'; // <-- 核心修改: 导入更新后的接口
import './Wallet.css';

interface WalletAssetListItemProps {
  asset: AggregatedAsset; // <-- 核心修改: 使用更新后的接口
  onSend: (symbol: string) => void;
  onReceive: (symbol: string) => void;
}

const WalletAssetListItem: Component<WalletAssetListItemProps> = (props) => {
  // --- 核心修改: 根据资产类型调整小数位数 ---
  const quantityDecimalPlaces = () => props.asset.assetType === 'stock' ? 2 : 6;

  return (
    <div class="wallet-asset-item">
      <div class="asset-info">
        {/* --- 核心修改: 将 assetType 传递给 AssetIcon --- */}
        <AssetIcon symbol={props.asset.symbol} assetType={props.asset.assetType} />
        <div class="asset-names">
          <div class="asset-short-name">{props.asset.symbol}</div>
          <div class="asset-long-name">{/* Full name if available */}</div>
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
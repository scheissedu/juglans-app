// packages/juglans-app/src/pages/wallet/WalletAssetListItem.tsx

import { Component } from 'solid-js';
import CryptoIcon from '../../components/icons/CryptoIcon';
import { AggregatedAsset } from './WalletAssetList';
import './Wallet.css';

interface WalletAssetListItemProps {
  asset: AggregatedAsset;
  onSend: (symbol: string) => void;
  onReceive: (symbol: string) => void;
}

const WalletAssetListItem: Component<WalletAssetListItemProps> = (props) => {
  return (
    <div class="wallet-asset-item">
      <div class="asset-info">
        <CryptoIcon symbol={props.asset.symbol} />
        <div class="asset-names">
          <div class="asset-short-name">{props.asset.symbol}</div>
          <div class="asset-long-name">{/* Full name if available */}</div>
        </div>
      </div>
      
      <div class="asset-balance">
        <div class="asset-amount">{props.asset.balance.total.toFixed(6)}</div>
        <div class="asset-usd-value">~${props.asset.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      <div class="asset-available">
        {props.asset.balance.free.toFixed(6)}
      </div>

      <div class="asset-actions">
        <button onClick={() => props.onSend(props.asset.symbol)}>Send</button>
        <button onClick={() => props.onReceive(props.asset.symbol)}>Receive</button>
      </div>
    </div>
  );
};

export default WalletAssetListItem;
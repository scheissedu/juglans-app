// packages/juglans-app/src/pages/wallet/WalletAssetList.tsx
import { Component, For, Show } from 'solid-js';
import WalletAssetListItem from './WalletAssetListItem';
import EmptyState from '../../components/common/EmptyState';
import './Wallet.css';
import { AssetBalance } from '@klinecharts/pro';

// --- 核心修改: 在接口中添加 assetType ---
export interface AggregatedAsset {
  symbol: string;
  balance: AssetBalance;
  usdValue: number;
  assetType: 'crypto' | 'stock';
}

interface WalletAssetListProps {
  assets: AggregatedAsset[];
  onSend: (symbol: string) => void;
  onReceive: (symbol: string) => void;
}

const WalletAssetList: Component<WalletAssetListProps> = (props) => {
  return (
    <div class="wallet-asset-list-container">
      <div class="wallet-asset-list-items">
        <Show 
          when={props.assets.length > 0}
          fallback={<EmptyState message="No Assets Yet" />}
        >
          <div class="wallet-list-header">
            <span>Asset</span>
            <span>Total</span>
            <span>Available</span>
            <span>Actions</span>
          </div>
          <For each={props.assets}>
            {(asset) => (
              <WalletAssetListItem 
                asset={asset} 
                onSend={props.onSend}
                onReceive={props.onReceive}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default WalletAssetList;
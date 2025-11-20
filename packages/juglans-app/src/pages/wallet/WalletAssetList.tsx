// packages/juglans-app/src/pages/wallet/WalletAssetList.tsx
import { Component, For, Show } from 'solid-js';
import WalletAssetListItem from './WalletAssetListItem';
import EmptyState from '../../components/common/EmptyState';
import './Wallet.css';
import { AssetBalance } from '@klinecharts/pro';

export interface AggregatedAsset {
  symbol: string;
  balance: AssetBalance;
  usdValue: number;
  assetType: 'crypto' | 'stock';
}

interface WalletAssetListProps {
  assets: AggregatedAsset[];
  viewMode: 'list' | 'card'; // 新增 Prop
  onSend: (symbol: string) => void;
  onReceive: (symbol: string) => void;
}

const WalletAssetList: Component<WalletAssetListProps> = (props) => {
  return (
    <div class="wallet-asset-list-wrapper">
      <Show 
        when={props.assets.length > 0}
        fallback={<EmptyState message="No Assets Yet" subMessage="Make a deposit to get started." />}
      >
        {/* --- Card View --- */}
        <Show when={props.viewMode === 'card'}>
          <div class="asset-card-grid">
             <For each={props.assets}>
                {(asset) => (
                  <WalletAssetListItem 
                    asset={asset}
                    viewMode="card"
                    onSend={props.onSend}
                    onReceive={props.onReceive}
                  />
                )}
             </For>
          </div>
        </Show>

        {/* --- List View --- */}
        <Show when={props.viewMode === 'list'}>
          {/* Header 已被移除，如果需要显示可以在这里加，但现在 CSS 里已经隐藏了 */}
          <div class="wallet-list-container">
             <For each={props.assets}>
                {(asset) => (
                  <WalletAssetListItem 
                    asset={asset}
                    viewMode="list"
                    onSend={props.onSend}
                    onReceive={props.onReceive}
                  />
                )}
             </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default WalletAssetList;
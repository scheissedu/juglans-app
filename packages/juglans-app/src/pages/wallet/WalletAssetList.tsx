import { Component, For, Show } from 'solid-js';
import WalletAssetListItem from './WalletAssetListItem';
// 1. 移除对 Pro Empty 的导入
// import { Empty } from '@klinecharts/pro'; 
import EmptyState from '../../components/common/EmptyState'; // 2. 导入我们自己的组件
import './Wallet.css';

export interface AggregatedAsset {
  symbol: string;
  name: string;
  usdValue: number;
  amount: number;
}

interface WalletAssetListProps {
  assets: AggregatedAsset[];
}

const WalletAssetList: Component<WalletAssetListProps> = (props) => {
  return (
    <div class="wallet-asset-list-container">
      <div class="wallet-asset-list-header">My Assets</div>
      <div class="wallet-asset-list-items">
        <Show 
          when={props.assets.length > 0}
          // 3. 使用新的 EmptyState 组件
          fallback={<EmptyState message="No Assets Yet" />}
        >
          <For each={props.assets}>
            {(asset) => <WalletAssetListItem {...asset} />}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default WalletAssetList;
import { Component, onMount, onCleanup, createMemo, createSignal, Show } from 'solid-js';
import { useAppContext, ChatExtension } from '../context/AppContext';
import { useBrokerState } from '@klinecharts/pro';
import { SuggestionItem } from '../components/chat/SuggestionList';
import type { Position } from '@klinecharts/pro';

// 导入核心组件
import WalletSummary from './wallet/WalletSummary';
import WalletActions from './wallet/WalletActions';
import WalletAssetList, { AggregatedAsset } from './wallet/WalletAssetList';
import ReceiveModal from './wallet/ReceiveModal';
import SendModal from './wallet/SendModal';

const WalletPage: Component = () => {
  const [state, actions] = useAppContext();
  const [brokerState] = useBrokerState();
  
  // State for controlling modals
  const [isReceiveModalOpen, setReceiveModalOpen] = createSignal(false);
  const [isSendModalOpen, setSendModalOpen] = createSignal(false);

  // A mock wallet address
  const myWalletAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

  // 使用 createMemo 来派生和聚合资产列表
  const aggregatedAssets = createMemo(() => {
    // 检查 brokerState.positions 是否存在且是一个数组
    if (!brokerState.positions || !Array.isArray(brokerState.positions)) {
      return [];
    }

    const assetMap = new Map<string, { amount: number; usdValue: number; name: string }>();

    for (const position of brokerState.positions) {
      // 从 "BTC-USDT" 中提取 "BTC"
      const baseSymbol = position.symbol.split('-')[0];
      
      // 假设 position 的价值就是它的数量 * 平均价格
      const positionValue = position.qty * position.avgPrice;

      if (assetMap.has(baseSymbol)) {
        const existing = assetMap.get(baseSymbol)!;
        existing.amount += position.qty;
        existing.usdValue += positionValue;
      } else {
        assetMap.set(baseSymbol, {
          amount: position.qty,
          usdValue: positionValue,
          name: baseSymbol, // 理想情况下，我们应该从 SymbolInfo 中获取全名
        });
      }
    }

    // 将 Map 转换为数组并排序
    const sortedAssets: AggregatedAsset[] = Array.from(assetMap.entries()).map(([symbol, data]) => ({
      symbol: symbol,
      name: data.name,
      amount: data.amount,
      usdValue: data.usdValue,
    }));

    // 按美元价值降序排序
    return sortedAssets.sort((a, b) => b.usdValue - a.usdValue);
  });

  onMount(() => {
    // 注册 Wallet 页面的聊天扩展
    const walletExtension: ChatExtension = {
      getContext: () => ({ myContext: true, accountInfo: brokerState.accountInfo, positions: brokerState.positions }),
      getCommands: () => [
        { key: 'show_balance', label: 'Show Balance', description: 'Display current wallet balance.' },
        { key: 'list_assets', label: 'List Assets', description: 'List all assets in the wallet.' }
      ],
      handleCommand: (item: SuggestionItem, editor) => {
        const message = `Executing wallet command: ${item.label}`;
        editor?.chain().focus().insertContent(message).run();
        actions.sendMessage(message);
      },
      getQuickSuggestions: () => [
        { text: "我的余额", sendImmediately: true },
        { text: "最近交易", sendImmediately: true },
      ],
      getAttachmentActions: () => []
    };
    actions.setChatExtension(walletExtension);
  });

  onCleanup(() => {
    // 离开页面时注销
    if (state.chatExtension && state.chatExtension.getCommands().some(c => c.key === 'show_balance')) {
        actions.setChatExtension(null);
    }
  });
  
  return (
    <div style={{ "overflow-y": "auto", height: "100%" }}>
      <WalletSummary accountInfo={brokerState.accountInfo} />
      
      <WalletActions 
        onSendClick={() => setSendModalOpen(true)}
        onReceiveClick={() => setReceiveModalOpen(true)}
      />
      
      <WalletAssetList assets={aggregatedAssets()} />

      <Show when={isReceiveModalOpen()}>
        <ReceiveModal 
          isOpen={isReceiveModalOpen()} 
          onClose={() => setReceiveModalOpen(false)} 
          address={myWalletAddress}
        />
      </Show>

      <Show when={isSendModalOpen()}>
        <SendModal
          isOpen={isSendModalOpen()}
          onClose={() => setSendModalOpen(false)}
        />
      </Show>
    </div>
  );
};

export default WalletPage;
import { Component, onMount, onCleanup, createMemo, createSignal, Show } from 'solid-js';
import { useAppContext, ChatExtension } from '../context/AppContext';
import { useBrokerState } from '@klinecharts/pro';
import { produce } from 'solid-js/store';
import { useEditor } from '@/context/EditorContext';
import { createWalletChatExtension } from '@/components/chat/extensions/wallet';

// 导入子组件
import WalletSummary from './wallet/WalletSummary';
import WalletActions from './wallet/WalletActions';
import WalletAssetList, { AggregatedAsset } from './wallet/WalletAssetList';
import WalletPositionsList from './wallet/WalletPositionsList';
import ReceiveModal from './wallet/ReceiveModal';
import SendModal from './wallet/SendModal';

// 导入样式
import './WalletPage.css';
import './wallet/Wallet.css';

const WalletPage: Component = () => {
  const [state, actions] = useAppContext();
  const [brokerState, setBrokerState] = useBrokerState();
  const { editor } = useEditor();
  
  const [activeTab, setActiveTab] = createSignal<'assets' | 'positions'>('assets');
  const [isReceiveModalOpen, setReceiveModalOpen] = createSignal(false);
  const [isSendModalOpen, setSendModalOpen] = createSignal(false);
  const [selectedAsset, setSelectedAsset] = createSignal('USDT');

  const myWalletAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

  const aggregatedAssets = createMemo((): AggregatedAsset[] => {
    const balances = brokerState.accountInfo?.balances;
    if (!balances) return [];

    return Object.entries(balances)
      .map(([symbol, balance]) => {
        let usdValue = 0;
        if (symbol === 'USDT' || symbol === 'USD') {
            usdValue = balance.total;
        } else {
            const mockPrices: Record<string, number> = { 'BTC': 65000, 'ETH': 3500 };
            usdValue = balance.total * (mockPrices[symbol] || 0);
        }
        return { symbol, balance, usdValue };
      })
      .sort((a, b) => b.usdValue - a.usdValue);
  });

  const handleOpenSend = (symbol: string) => {
    setSelectedAsset(symbol);
    setSendModalOpen(true);
  };

  const handleOpenReceive = (symbol: string) => {
    setSelectedAsset(symbol);
    setReceiveModalOpen(true);
  };
  
  const refetchPositions = async () => {
    const brokerApi = state.brokerApi;
    try {
      const positions = await brokerApi.getPositions();
      setBrokerState('positions', produce(p => {
        p.splice(0, p.length, ...positions);
      }));
    } catch (e) {
      console.error("Failed to refetch positions", e);
    }
  };

  const mockDeposit = async () => {
    try {
      await state.brokerApi.deposit('USDT', 10000);
      await state.brokerApi.deposit('BTC', 0.5);
      await state.brokerApi.deposit('ETH', 10);
      alert("Mock assets have been deposited!");
    } catch (e: any) {
      alert(`Deposit failed: ${e.message}`);
    }
  };

  onMount(() => {
    console.log('[WalletPage] Mounting and registering wallet chat extension.');
    const walletExtension = createWalletChatExtension(
      [state, actions],
      brokerState,
      mockDeposit
    );
    actions.setChatExtension(walletExtension);
  });

  onCleanup(() => {
    console.log('[WalletPage] Cleaning up, unregistering wallet chat extension.');
    if (state.chatExtension && state.chatExtension.getCommands().some(c => c.key === 'balance')) {
        actions.setChatExtension(null);
    }
  });
  
  return (
    <div style={{ "height": "100%", "display": "flex", "flex-direction": "column" }}>
      <div style={{ "overflow-y": "auto", "flex-shrink": "1" }}>
        <WalletSummary accountInfo={brokerState.accountInfo} />
        
        {/*
        <WalletActions 
          onSendClick={() => handleOpenSend('USDT')}
          onReceiveClick={() => handleOpenReceive('USDT')}
          onMockDepositClick={mockDeposit} 
        />
        */}
      </div>
      
      <div class="wallet-tabs">
        <button class={`tab-item ${activeTab() === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>
          Assets
        </button>
        <button class={`tab-item ${activeTab() === 'positions' ? 'active' : ''}`} onClick={() => setActiveTab('positions')}>
          Positions
        </button>
      </div>
      
      <div style={{"flex": "1", "min-height": "0", "position": "relative"}}>
        <Show when={activeTab() === 'assets'}>
          <WalletAssetList 
            assets={aggregatedAssets()}
            onSend={handleOpenSend}
            onReceive={handleOpenReceive}
          />
        </Show>
        <Show when={activeTab() === 'positions'}>
          <WalletPositionsList 
            positions={brokerState.positions}
            onRefetch={refetchPositions}
          />
        </Show>
      </div>

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
          initialAsset={selectedAsset()}
        />
      </Show>
    </div>
  );
};

export default WalletPage;
// packages/juglans-app/src/pages/WalletPage.tsx
import { Component, onMount, onCleanup, createMemo, createSignal, Show, createEffect } from 'solid-js';
import { useAppContext } from '../context/AppContext';
import { useEditor } from '@/context/EditorContext';
import { createWalletChatExtension } from '@/components/chat/extensions/wallet';

// 导入子组件
import WalletSummary from './wallet/WalletSummary';
import WalletActions from './wallet/WalletActions';
import WalletAssetList, { AggregatedAsset } from './wallet/WalletAssetList';
import WalletPositionsList from './wallet/WalletPositionsList';
import ReceiveModal from './wallet/ReceiveModal';
import SendModal from './wallet/SendModal';
import GridIcon from '@/components/icons/GridIcon'; // Reusing icons or create specific ones if needed
import HamburgerIcon from '@/components/icons/HamburgerIcon'; // Using as "List" icon

// 导入样式
import './WalletPage.css'; // Waitlist css for reuse (if needed for global styles, but we copied card styles to Wallet.css)
import './wallet/Wallet.css';

const WalletPage: Component = () => {
  const [state, actions] = useAppContext();
  const { editor } = useEditor();
  
  const [activeTab, setActiveTab] = createSignal<'assets' | 'positions'>('assets');
  // --- 新增: 视图模式状态 ---
  const [viewMode, setViewMode] = createSignal<'list' | 'card'>('card');
  
  const [isReceiveModalOpen, setReceiveModalOpen] = createSignal(false);
  const [isSendModalOpen, setSendModalOpen] = createSignal(false);
  const [selectedAsset, setSelectedAsset] = createSignal('USDT');

  const myWalletAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";
  
  const aggregatedAssets = createMemo((): AggregatedAsset[] => {
    const balances = state.accountInfo?.balances;
    if (!balances) return [];

    const mockPrices: Record<string, number> = { 
      'BTC': 65000, 
      'ETH': 3500,
      'AAPL': 170.50,
      'NVDA': 950.00
    };
    
    const knownStocks = new Set(['AAPL', 'NVDA', 'TSLA', 'GOOG']);

    return Object.entries(balances)
      .map(([symbol, balance]) => {
        const assetType = knownStocks.has(symbol.toUpperCase()) ? 'stock' : 'crypto';
        
        let usdValue = 0;
        if (symbol === 'USDT' || symbol === 'USD') {
            usdValue = balance.total;
        } else {
            usdValue = balance.total * (mockPrices[symbol.toUpperCase()] || 0);
        }
        
        return { symbol, balance, usdValue, assetType };
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
      actions.setPositions(() => positions);
    } catch (e) {
      console.error("Failed to refetch positions", e);
    }
  };

  const mockDeposit = async () => {
    try {
      await state.brokerApi.deposit('USDT', 10000);
      await state.brokerApi.deposit('BTC', 0.5);
      await state.brokerApi.deposit('ETH', 10);
      await state.brokerApi.deposit('AAPL', 50);
      await state.brokerApi.deposit('NVDA', 10);
      alert("Mock assets (including stocks) have been deposited!");
    } catch (e: any) {
      alert(`Deposit failed: ${e.message}`);
    }
  };

  onMount(() => {
    const walletExtension = createWalletChatExtension(
      [state, actions],
      state,
      mockDeposit
    );
    actions.setChatExtension(walletExtension);
  });

  onCleanup(() => {
    if (state.chatExtension && state.chatExtension.getCommands().some(c => c.key === 'balance')) {
        actions.setChatExtension(null);
    }
  });
  
  return (
    // --- 核心修改: 使用 portfolio-page-container 实现整页滚动 ---
    <div class="portfolio-page-container">
      <div class="portfolio-header-section">
        <WalletSummary accountInfo={state.accountInfo} />
        
        <WalletActions 
          onSendClick={() => handleOpenSend('USDT')}
          onReceiveClick={() => handleOpenReceive('USDT')}
          onMockDepositClick={mockDeposit} 
        />
      </div>
      
      {/* --- 核心修改: 控制栏 (Tab + Toggle) --- */}
      <div class="portfolio-controls">
        <div class="wallet-tabs">
          <button class={`tab-item ${activeTab() === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>
            Assets
          </button>
          <button class={`tab-item ${activeTab() === 'positions' ? 'active' : ''}`} onClick={() => setActiveTab('positions')}>
            Positions
          </button>
        </div>

        {/* 仅在 Assets Tab 显示切换按钮 */}
        <Show when={activeTab() === 'assets'}>
          <div class="view-toggle-pill">
             <button 
               class="view-toggle-btn" 
               classList={{ active: viewMode() === 'card' }}
               onClick={() => setViewMode('card')}
             >
               <GridIcon /> Card
             </button>
             <button 
               class="view-toggle-btn" 
               classList={{ active: viewMode() === 'list' }}
               onClick={() => setViewMode('list')}
             >
               <HamburgerIcon /> List
             </button>
          </div>
        </Show>
      </div>
      
      <div class="asset-content-container">
        <Show when={activeTab() === 'assets'}>
          <WalletAssetList 
            assets={aggregatedAssets()}
            viewMode={viewMode()} // 传入视图模式
            onSend={handleOpenSend}
            onReceive={handleOpenReceive}
          />
        </Show>
        <Show when={activeTab() === 'positions'}>
          <WalletPositionsList 
            positions={state.positions}
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
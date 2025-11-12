// packages/juglans-app/src/components/chat/extensions/wallet.ts
import { AppContextState, AppContextValue, ChatExtension } from '../../../context/AppContext';
import { SuggestionItem } from '../SuggestionList';
import type { Editor } from '@tiptap/core';

export function createWalletChatExtension(
  appContext: AppContextValue,
  appState: AppContextState,
  mockDepositFn: () => Promise<void>
): ChatExtension {
  
  const [state, actions] = appContext;
  
  const getContext = () => {
    return {
      page: 'wallet',
      myContext: true,
      accountInfo: appState.accountInfo,
      positions: appState.positions
    };
  };

  const getCommands = (): SuggestionItem[] => [
    { key: 'balance', label: 'Balance', description: 'Show my current wallet balance.' },
    { key: 'deposit', label: 'Mock Deposit', description: 'Deposit test funds (10k USDT, 0.5 BTC, 10 ETH).' },
    { key: 'positions', label: 'My Positions', description: 'List my current open positions.' },
  ];

  // --- 核心修复：将函数设为 async 并主动获取数据 ---
  const handleCommand = async (item: SuggestionItem, editor: Editor | null) => {
    const dispatchAttachmentEvent = (attachment: any) => {
      const event = new CustomEvent('add-chat-attachment', { detail: attachment });
      document.body.dispatchEvent(event);
    };

    switch (item.key) {
      case 'balance': {
        try {
          // 主动从 brokerApi 获取最新的账户信息
          const accountInfo = await state.brokerApi.getAccountInfo();
          const balances = accountInfo.balances;
          if (balances && Object.keys(balances).length > 0) {
            dispatchAttachmentEvent({
              id: `balance_${Date.now()}`,
              type: 'balance',
              data: balances
            });
          } 
        } catch (error) {
          console.error("Failed to fetch account balance:", error);
        }
        break;
      }
      case 'deposit':
        mockDepositFn();
        editor?.chain().focus().insertContent('Executing mock deposit...').run();
        setTimeout(() => editor?.chain().clearContent().run(), 2000);
        break;
      case 'positions': {
        try {
          // 主动获取最新的持仓信息
          const positions = await state.brokerApi.getPositions();
          if (positions && positions.length > 0) {
              dispatchAttachmentEvent({
                id: `pos_${Date.now()}`,
                type: 'position',
                data: positions
              });
          }
        } catch (error) {
            console.error("Failed to fetch positions:", error);
        }
        break;
      }
    }
  };

  const getQuickSuggestions = () => [
    { text: "我的余额", sendText: "@Balance", sendImmediately: true },
    { text: "我的仓位", sendText: "@My Positions", sendImmediately: true },
    { text: "模拟充值", sendText: "@Mock Deposit", sendImmediately: true },
  ];

  const getAttachmentActions = () => [];

  return {
    getContext,
    getCommands,
    handleCommand,
    getQuickSuggestions,
    getAttachmentActions
  };
}
import { AppContextValue, ChatExtension } from '../../../context/AppContext';
import { SuggestionItem } from '../SuggestionList';
import type { Editor } from '@tiptap/core';
import { BrokerState } from '@klinecharts/pro';

export function createWalletChatExtension(
  appContext: AppContextValue,
  brokerState: BrokerState,
  mockDepositFn: () => Promise<void>
): ChatExtension {
  
  const [state, actions] = appContext;
  
  const getContext = () => {
    return {
      page: 'wallet',
      myContext: true,
      accountInfo: brokerState.accountInfo,
      positions: brokerState.positions
    };
  };

  const getCommands = (): SuggestionItem[] => [
    { key: 'balance', label: 'Balance', description: 'Show my current wallet balance.' },
    { key: 'deposit', label: 'Mock Deposit', description: 'Deposit test funds (10k USDT, 0.5 BTC, 10 ETH).' },
    { key: 'positions', label: 'My Positions', description: 'List my current open positions.' },
  ];

  const handleCommand = (item: SuggestionItem, editor: Editor | null) => {
    switch (item.key) {
      case 'balance': {
        const balances = brokerState.accountInfo?.balances;
        if (balances && Object.keys(balances).length > 0) {
          const newAttachment = {
            type: 'balance',
            id: `balance_${Date.now()}`,
            data: JSON.stringify(balances)
          };
          const event = new CustomEvent('add-chat-attachment', { detail: newAttachment });
          document.body.dispatchEvent(event);
        } else {
          actions.sendMessage("I can't find any assets in your wallet.");
        }
        break;
      }
      case 'deposit':
        mockDepositFn();
        editor?.chain().focus().insertContent('Executing mock deposit...').run();
        setTimeout(() => editor?.chain().clearContent().run(), 2000);
        break;
      case 'positions': {
        const positions = brokerState.positions;
        if (positions && positions.length > 0) {
            const newAttachment = {
              type: 'position',
              id: `pos_${Date.now()}`,
              data: JSON.stringify(positions)
            };
            const event = new CustomEvent('add-chat-attachment', { detail: newAttachment });
            document.body.dispatchEvent(event);
        } else {
          actions.sendMessage("You don't have any open positions right now.");
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
// packages/juglans-app/src/components/chat/extensions/market.ts
import { Accessor } from 'solid-js';
import { AppContextValue, ChatExtension, QuickSuggestion } from '../../../context/AppContext';
import { SuggestionItem } from '../SuggestionList';
import type { Editor } from '@tiptap/core';
import type { Instrument } from '@/instruments';

export function createMarketChatExtension(
  appContext: AppContextValue,
  editor: Accessor<Editor | null>,
  activeInstruments: Accessor<Instrument[]>
): ChatExtension {
  
  const [state, actions] = appContext;
  
  const getContext = async () => {
    // 告诉 AI 用户在市场页面，以及当前列表有哪些股票/加密货币
    return {
      page: 'market',
      current_asset_list: activeInstruments().map(i => ({
        identifier: i.identifier,
        displayName: i.getDisplayName(),
      })),
    };
  };

  const getCommands = (): SuggestionItem[] => [
    { key: 'view_chart', label: 'View Chart', description: 'Usage: @View Chart <TICKER>' },
    { key: 'add_watchlist', label: 'Add to Watchlist', description: 'Usage: @Add to Watchlist <TICKER>' },
  ];

  const handleCommand = (item: SuggestionItem, edt: Editor | null) => {
    if (!edt) return;

    // 简单地插入模板，让用户填充 ticker
    switch (item.key) {
      case 'view_chart': {
        // 使用 /navigate 命令，因为这最终会由后端处理
        edt.chain().focus().insertContent('/navigate chart ').run();
        break;
      }
      case 'add_watchlist': {
        // 这是一个前端逻辑，可以直接处理
        edt.chain().focus().insertContent('Add to watchlist ').run();
        // 也可以引导用户使用命令，或者直接通过 AI 分析文本
        break;
      }
    }
  };

  return {
    getContext,
    getCommands,
    handleCommand,
    getQuickSuggestions: (): QuickSuggestion[] => [
      { text: "What are the top 3 movers?", sendImmediately: false }, 
      { text: "Show me tech stocks", sendText: "search for tech stocks", sendImmediately: true },
      { text: "Go to my wallet", sendText: "/navigate wallet", sendImmediately: true },
    ],
    getAttachmentActions: () => [], // 市场页面没有附加操作
  };
}
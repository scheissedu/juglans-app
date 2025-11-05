// packages/juglans-app/src/components/chat/extensions/chart.ts

import { KLineChartPro } from '@klinecharts/pro';
import { AppContextValue, ChatExtension, QuickSuggestion } from '../../../context/AppContext';
import { SuggestionItem } from '../SuggestionList';
import { Component } from 'solid-js';
import PlusIcon from '../../icons/PlusIcon';
import type { Editor } from '@tiptap/core';

export function createChartChatExtension(
  appContext: AppContextValue,
  editor: () => Editor | null
): ChatExtension {
  
  const [state, actions] = appContext;
  
  const getContext = () => {
    const chartInstance = state.chart;
    const chart = chartInstance?.getChart();

    const baseContext = { symbol: state.symbol, period: state.period };

    if (!chart) {
      return baseContext;
    }
    const dataList = chart.getDataList() ?? [];
    return {
      ...baseContext,
      marketContext: true,
      klineData: dataList.slice(-100),
    };
  };

  const getCommands = (): SuggestionItem[] => [
    { key: 'add_klines', label: 'Recent 100 Bars', description: 'Attach the last 100 K-line bars.' },
    { key: 'add_symbol', label: 'Symbol Info', description: 'Attach current symbol information.' },
    { key: 'add_positions', label: 'My Positions', description: 'Attach your current open positions.' },
  ];

  const handleCommand = async (item: SuggestionItem, edt: Editor | null) => {
    const chartInstance = state.chart;
    const chart = chartInstance?.getChart();
    if (!chart || !edt) return;

    switch (item.key) {
      case 'add_klines': {
        const range = chart.getVisibleRange();
        const dataList = chart.getDataList();
        const klineData = dataList.slice(range.from, range.to);
        const event = new CustomEvent('add-chat-attachment', { detail: { type: 'kline', id: `kline_${Date.now()}`, symbol: state.symbol.shortName || state.symbol.ticker, period: state.period.text, data: JSON.stringify(klineData) } });
        document.body.dispatchEvent(event);
        break;
      }
      case 'add_symbol': {
        const symbolInfo = state.symbol;
        const text = `Symbol: ${symbolInfo.shortName}\nName: ${symbolInfo.name}\nExchange: ${symbolInfo.exchange}\nType: ${symbolInfo.type}`;
        edt.chain().focus().insertContent(text.replace(/\n/g, '<br>')).run();
        break;
      }
      case 'add_positions': {
        try {
          const positions = await state.brokerApi.getPositions();
          const event = new CustomEvent('add-chat-attachment', { detail: { type: 'position', id: `pos_${Date.now()}`, data: JSON.stringify(positions) } });
          document.body.dispatchEvent(event);
        } catch (error) { console.error("Failed to fetch positions:", error); }
        break;
      }
    }
  };

  const handleSelectKLine = () => {
    const chartInstance = state.chart;
    if (!chartInstance) return;

    const chart = chartInstance.getChart();
    if (!chart) return;
    
    if (chartInstance instanceof KLineChartPro) {
      if (chart.getOverlayById('robot_selection_rect_instance')) {
        chart.removeOverlay('robot_selection_rect_instance');
      }
      chart.createOverlay({
        name: 'rect',
        id: 'robot_selection_rect_instance',
        groupId: 'robot_selection_rect',
        lock: false,
        styles: { polygon: { color: 'rgba(191, 255, 0, 0.2)', borderColor: 'var(--primary-highlight)', borderStyle: 'dashed' } },
        onDrawEnd: (event) => {
          const { overlay } = event;
          const points = overlay.points;
          if (points.length === 2 && points[0].dataIndex !== undefined && points[1].dataIndex !== undefined) {
            const startIndex = Math.min(points[0].dataIndex, points[1].dataIndex);
            const endIndex = Math.max(points[0].dataIndex, points[1].dataIndex);
            const selectedData = chart.getDataList().slice(startIndex, endIndex + 1);
            
            // --- 核心修正：直接派发 add-chat-attachment 事件 ---
            const newAttachment = {
              type: 'kline',
              id: `kline_${Date.now()}`,
              symbol: state.symbol.shortName || state.symbol.ticker,
              period: state.period.text,
              data: JSON.stringify(selectedData)
            };
            const customEvent = new CustomEvent('add-chat-attachment', { detail: newAttachment });
            document.body.dispatchEvent(customEvent);
            // --- 修正结束 ---
          }
          chart.removeOverlay(overlay.id);
        }
      });
    } else {
      const range = chart.getVisibleRange();
      const data = chart.getDataList().slice(range.from, range.to);
      // --- 核心修正：直接派发 add-chat-attachment 事件 ---
       const newAttachment = {
          type: 'kline',
          id: `kline_${Date.now()}`,
          symbol: state.symbol.shortName || state.symbol.ticker,
          period: state.period.text,
          data: JSON.stringify(data)
       };
      const customEvent = new CustomEvent('add-chat-attachment', { detail: newAttachment });
      document.body.dispatchEvent(customEvent);
      // --- 修正结束 ---
      alert(`Attached ${data.length} visible bars from the Light chart.`);
    }
  };

  return {
    getContext,
    getCommands,
    handleCommand,
    getQuickSuggestions: (): QuickSuggestion[] => [
      { text: "分析一下", sendImmediately: false }, 
      { 
        text: "我的仓位", 
        sendText: "/card my_positions", 
        sendImmediately: true 
      },
      { 
        text: "看看市场", 
        sendText: "/navigate market", 
        sendImmediately: true 
      },
    ],
    getAttachmentActions: () => [
      { 
        icon: PlusIcon, 
        action: handleSelectKLine, 
        tooltip: "Select K-line area from chart",
        label: "Select K-line Area"
      }
    ]
  };
}
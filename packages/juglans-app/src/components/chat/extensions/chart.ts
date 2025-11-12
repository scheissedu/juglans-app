// packages/juglans-app/src/components/chat/extensions/chart.ts

import { KLineChartPro, SymbolInfo } from '@klinecharts/pro';
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

    const baseContext = { 
      // 传递完整的 instrument 标识符字符串给后端
      instrument: state.instrument.identifier,
      period: state.period 
    };

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

    const dispatchAttachmentEvent = (attachment: any) => {
      const customEvent = new CustomEvent('add-chat-attachment', { detail: attachment });
      document.body.dispatchEvent(customEvent);
    };

    switch (item.key) {
      case 'add_klines': {
        const dataList = chart.getDataList();
        const klineData = dataList.slice(-100);
        
        dispatchAttachmentEvent({
          id: `kline_${Date.now()}`,
          type: 'kline',
          data: {
            symbol: state.instrument.getDisplayName(),
            period: state.period.text,
            data: klineData
          }
        });
        break;
      }
      case 'add_symbol': {
        const instrument = state.instrument;
        // 创建一个普通的 SymbolInfo 对象，避免直接传递响应式代理
        const symbolInfo: SymbolInfo = {
          ticker: instrument.getTicker(),
          name: instrument.getDisplayName(),
          shortName: instrument.baseSymbol,
          exchange: instrument.market,
          market: instrument.assetClass.toLowerCase().includes('stock') ? 'stocks' : 'crypto',
          priceCurrency: instrument.quoteCurrency,
        };
        dispatchAttachmentEvent({
          id: `symbol_${Date.now()}`,
          type: 'symbolInfo',
          data: symbolInfo
        });
        break;
      }
      case 'add_positions': {
        try {
          const positions = await state.brokerApi.getPositions();
          dispatchAttachmentEvent({
            id: `pos_${Date.now()}`,
            type: 'position',
            data: positions
          });
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
    
    const dispatchAttachmentEvent = (attachment: any) => {
      const customEvent = new CustomEvent('add-chat-attachment', { detail: attachment });
      document.body.dispatchEvent(customEvent);
    };

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
            
            dispatchAttachmentEvent({
              id: `kline_${Date.now()}`,
              type: 'kline',
              data: {
                symbol: state.instrument.getDisplayName(),
                period: state.period.text,
                data: selectedData
              }
            });
          }
          chart.removeOverlay(overlay.id);
        }
      });
    } else {
      const range = chart.getVisibleRange();
      const data = chart.getDataList().slice(range.from, range.to);
      dispatchAttachmentEvent({
        id: `kline_${Date.now()}`,
        type: 'kline',
        data: {
          symbol: state.instrument.getDisplayName(),
          period: state.period.text,
          data: data
        }
      });
      alert(`Attached ${data.length} visible bars from the Light chart.`);
    }
  };

  return {
    getContext,
    getCommands,
    handleCommand,
    getQuickSuggestions: (): QuickSuggestion[] => [
      { text: "分析一下", sendImmediately: false }, 
      { text: "我的仓位", sendText: "/card my_positions", sendImmediately: true },
      { text: "看看市场", sendText: "/navigate market", sendImmediately: true },
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
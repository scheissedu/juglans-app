// packages/juglans-app/src/components/chat/tools/handleTradeSuggestion.ts

import { produce, SetStoreFunction } from 'solid-js/store';
// --- 核心修改 1: 移除对 KLineChartPro 的直接导入 ---
// import { KLineChartPro } from '@klinecharts/pro';
import type { AppContextState } from '../../../context/AppContext';
// --- 核心修改 2: 从 ChatArea 导入 ToolCallMessage 类型 ---
import type { Message, ToolCallMessage } from '../ChatArea';

/**
 * 处理创建交易建议的工具调用
 * @param params - AI 返回的工具参数
 * @param state - 全局应用 state，用于获取图表实例
 * @param setMessages - 更新聊天消息的状态函数
 */
export function handleTradeSuggestion(
  params: any,
  state: AppContextState,
  setMessages: SetStoreFunction<Message[]>
) {
  // --- 核心修改 3: 放宽检查，只要有图表实例即可 ---
  if (state.chart && state.chart.getChart()) {
    const chart = state.chart.getChart()!;
    const dataList = chart.getDataList();
    const lastData = dataList.length > 0 ? dataList[dataList.length - 1] : null;

    if (!lastData) {
      console.warn('[Tool] Cannot create trade suggestion, chart data is empty.');
      // 可以在此向用户发送一条错误消息
      const errorContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: "Sorry, I can't create a trade suggestion because the chart data is not available." }] }] };
      setMessages(produce(msgs => {
          msgs.push({ type: 'text', role: 'assistant', text: errorContent, attachments: [] });
      }));
      return;
    }

    // --- 核心修改 4: 移除对 TradeSuggestion 类型的依赖，因为该类型在 ChatArea 中未导出 ---
    // 构建一个通用的 suggestion 对象
    const suggestion = {
      status: "SUGGEST",
      strategy_name: "AI Trade Suggestion",
      confidence_score: params.confidence_score ?? 0.85,
      summary: params.summary,
      trade_suggestion: {
        ...params,
        // 如果是市价单，使用最新的收盘价作为入口价参考
        entry_price: params.orderType === 'market' ? lastData.close : params.price,
        // 兼容AI可能返回的不同字段名
        position_size_usd: params.position_size_usd ?? params.quantity,
      },
    };

    setMessages(produce(msgs => {
      const toolCallMsg: ToolCallMessage = {
        type: 'tool_call',
        role: 'assistant',
        tool_name: 'create_trade_suggestion',
        tool_params: suggestion
      };
      msgs.push(toolCallMsg);
    }));

  } else {
    // 这个警告现在只会在完全没有图表实例时触发
    console.warn('[Tool] Trade suggestion requires an active chart instance.');
    const errorContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: "Sorry, I can't create a trade suggestion as there is no chart available." }] }] };
      setMessages(produce(msgs => {
          msgs.push({ type: 'text', role: 'assistant', text: errorContent, attachments: [] });
      }));
  }
}
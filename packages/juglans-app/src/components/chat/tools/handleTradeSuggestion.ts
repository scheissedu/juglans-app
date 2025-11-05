// packages/juglans-app/src/components/chat/tools/handleTradeSuggestion.ts

import { produce, SetStoreFunction } from 'solid-js/store';
import { KLineChartPro } from '@klinecharts/pro';
import type { AppContextState } from '../../../context/AppContext';
import type { Message, TradeSuggestion } from '../ChatArea';

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
  if (state.chart instanceof KLineChartPro) {
    const chart = state.chart.getChart()!;
    const lastData = chart.getDataList().slice(-1)[0];

    const suggestion: TradeSuggestion = {
      status: "SUGGEST",
      strategy_name: "AI Trade Suggestion",
      confidence_score: 0.85, // 可以从AI响应中获取或设为默认值
      summary: params.summary,
      trade_suggestion: {
        ...params,
        entry_price: params.orderType === 'market' ? lastData.close : params.price,
        position_size_usd: params.quantity, // 假设 quantity 就是 USD 价值
        risk_reward_ratio: 0, // 可以在卡片组件中动态计算
      },
    };

    setMessages(produce(msgs => {
      msgs.push({
        type: 'tool_call',
        role: 'assistant',
        tool_name: 'create_trade_suggestion',
        tool_params: suggestion
      });
    }));
  } else {
    console.warn('[Tool] Trade suggestion can only be handled in Pro mode.');
  }
}
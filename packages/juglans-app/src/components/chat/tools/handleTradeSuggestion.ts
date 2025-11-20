// packages/juglans-app/src/components/chat/tools/handleTradeSuggestion.ts

import { produce, SetStoreFunction } from 'solid-js/store';
import type { AppContextState } from '../../../context/AppContext';
import type { Message, ToolCallMessage } from '../ChatArea';
import type { TradeSuggestionData, FuturesTradeSuggestion } from '@/components/cards-p/TradeSuggestionCard/types';

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
  // +++ 核心修复：在这里完成数据计算和补全 +++

  // 1. 将 AI 返回的参数视为不完整的建议
  const partialSuggestion = params as Partial<FuturesTradeSuggestion>;
  
  // 2. 初始化一个完整的建议对象
  let finalSuggestion: TradeSuggestionData;

  if (partialSuggestion.marketType === 'FUTURES') {
    let entryPrice = 0;
    let positionSizeUsd = 0;
    const chart = state.chart?.getChart();

    if (chart) {
      const dataList = chart.getDataList();
      const lastData = dataList.length > 0 ? dataList[dataList.length - 1] : null;
      if (lastData) {
        // 使用图表最新价格作为入口价
        entryPrice = lastData.close;
        // 计算仓位价值
        positionSizeUsd = (partialSuggestion.quantity ?? 0) * entryPrice;
      }
    } else {
        // 如果没有图表，无法计算准确价格，可以给一个错误提示或默认值
        console.warn('[Tool] No active chart to determine market price for futures order. Prices will be zero.');
    }

    // 补全缺失的字段
    finalSuggestion = {
      confidence_score: 0.85, // 可以在前端设置一个默认值
      ...partialSuggestion,
      marketType: 'FUTURES',
      entry_price: entryPrice,
      position_size_usd: positionSizeUsd,
    } as FuturesTradeSuggestion;

  } else {
    // 为期权和预测市场保留扩展空间
    finalSuggestion = {
      confidence_score: 0.85,
      ...partialSuggestion,
    } as TradeSuggestionData;
  }
  
  // 3. 将最终的、完整的建议对象封装成 ToolCallMessage
  const toolCallMsg: ToolCallMessage = {
    type: 'tool_call',
    role: 'assistant',
    tool_name: 'create_trade_suggestion',
    tool_params: finalSuggestion
  };

  setMessages(produce(msgs => {
    msgs.push(toolCallMsg);
  }));
}
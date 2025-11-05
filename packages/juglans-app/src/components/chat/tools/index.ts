// packages/juglans-app/src/components/chat/tools/index.ts

import { SetStoreFunction } from 'solid-js/store';
import { AppContextValue } from '../../../context/AppContext';
import type { Message, ToolCallMessage } from '../ChatArea';
import { handleNavigate } from './handleNavigate';
import { handleTradeSuggestion } from './handleTradeSuggestion';

/**
 * 统一执行 AI 工具调用
 * @param toolCall - 从后端收到的工具调用对象
 * @param appContext - 应用的全局上下文 [state, actions]
 * @param setMessages - 更新聊天消息的状态函数
 */
export function executeToolCall(
  toolCall: ToolCallMessage,
  appContext: AppContextValue,
  setMessages: SetStoreFunction<Message[]>
) {
  const [state, actions] = appContext;

  switch (toolCall.tool_name) {
    case 'navigate_to_page':
      handleNavigate(toolCall.tool_params, actions, setMessages);
      break;
    
    case 'create_trade_suggestion':
      handleTradeSuggestion(toolCall.tool_params, state, setMessages);
      break;

    default:
      console.warn(`[Tool Executor] Unhandled tool call: ${toolCall.tool_name}`);
      const feedbackContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: `未知指令: ${toolCall.tool_name}` }] }] };
      setMessages(produce(msgs => {
        msgs.push({ type: 'text', role: 'assistant', text: feedbackContent, attachments: [] });
      }));
      break;
  }
}
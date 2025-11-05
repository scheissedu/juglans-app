// packages/juglans-app/src/components/chat/tools/handleNavigate.ts

import { produce, SetStoreFunction } from 'solid-js/store';
import type { JSONContent } from '@tiptap/core';
import type { AppContextActions } from '../../../context/AppContext';
import type { Message } from '../ChatArea'; // 从 ChatArea 导入类型

/**
 * 处理页面导航工具调用
 * @param params - AI 返回的工具参数
 * @param actions - 全局应用 actions，包含 navigate 方法
 * @param setMessages - 更新聊天消息的状态函数
 */
export function handleNavigate(
  params: { page: string },
  actions: AppContextActions,
  setMessages: SetStoreFunction<Message[]>
) {
  const page = params.page;
  if (page && actions.navigate) {
    // 1. 执行页面跳转
    actions.navigate(`/${page}`);

    // 2. 在聊天界面中给用户一个反馈
    const feedbackText = `好的，正在前往 ${page} 页面...`;
    const feedbackContent: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: feedbackText }] }]
    };
    setMessages(produce(msgs => {
      msgs.push({ type: 'text', role: 'assistant', text: feedbackContent, attachments: [] });
    }));
  } else {
    console.warn('[Tool] Navigate called with invalid page:', page);
  }
}
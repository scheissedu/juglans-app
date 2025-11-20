// packages/juglans-app/src/store/chatStore.ts
import { createStore, produce } from "solid-js/store";
import { ChatMessage } from "@/components/live-chat/socket";

interface ChannelCache {
  messages: ChatMessage[];
  hasMore: boolean;
  lastUpdated: number;
  scrollPosition?: number;
}

interface ChatStore {
  channels: Record<string, ChannelCache>;
}

const [chatStore, setChatStore] = createStore<ChatStore>({
  channels: {},
});

export const getChannelMessages = (roomId: string) => {
  return chatStore.channels[roomId]?.messages || [];
};

const initChannel = (roomId: string) => {
  if (!chatStore.channels[roomId]) {
    setChatStore("channels", roomId, {
      messages: [],
      hasMore: true,
      lastUpdated: Date.now(),
    });
  }
};

// --- 核心修改：添加消息 (包含 tempId 替换逻辑) ---
export const addMessageToChannel = (roomId: string, message: ChatMessage) => {
  initChannel(roomId);
  
  setChatStore("channels", roomId, "messages", produce((msgs) => {
    // 1. 尝试通过 tempId 查找 (用于乐观更新替换)
    if (message.tempId) {
      const tempIndex = msgs.findIndex(m => m.tempId === message.tempId);
      if (tempIndex !== -1) {
        // 找到了！这是刚才发的假消息，现在被服务端返回的真消息替换
        msgs[tempIndex] = message;
        return; // 退出，不追加
      }
    }

    // 2. 尝试通过真实 ID 查找 (防止重复广播)
    const idIndex = msgs.findIndex(m => m.id === message.id);
    if (idIndex !== -1) {
      // 已经存在了，更新一下内容以防万一，但不追加
      msgs[idIndex] = message;
      return;
    }

    // 3. 都不存在，追加到末尾
    msgs.push(message);
  }));
};

export const setChannelHistory = (roomId: string, history: ChatMessage[], hasMore: boolean) => {
  initChannel(roomId);
  setChatStore("channels", roomId, produce((channel) => {
    const existingIds = new Set(channel.messages.map(m => m.id));
    
    // 只保留那些本地没有的消息
    const newUniqueMessages = history.filter(m => !existingIds.has(m.id));
    
    if (newUniqueMessages.length > 0) {
      // 合并并按时间排序
      const allMsgs = [...channel.messages, ...newUniqueMessages];
      allMsgs.sort((a, b) => a.timestamp - b.timestamp);
      channel.messages = allMsgs;
    }
    
    if (history.length < 50) {
      channel.hasMore = false;
    }
    channel.lastUpdated = Date.now();
  }));
};

export const prependChannelHistory = (roomId: string, history: ChatMessage[]) => {
  initChannel(roomId);
  setChatStore("channels", roomId, produce((channel) => {
    const existingIds = new Set(channel.messages.map(m => m.id));
    const newMsgs = history.filter(m => !existingIds.has(m.id));
    
    if (newMsgs.length > 0) {
      channel.messages = [...newMsgs, ...channel.messages];
    }
    
    if (history.length < 50) {
      channel.hasMore = false;
    }
  }));
};

export { chatStore };
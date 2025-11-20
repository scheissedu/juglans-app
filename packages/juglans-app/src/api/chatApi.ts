// packages/juglans-app/src/api/chatApi.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface Conversation {
  id: string;
  roomId: string;
  lastMessage: string;
  lastMessageAt: string;
  otherUser: {
    id: string;
    username: string;
    nickname: string;
    avatar: string | null;
  };
}

/**
 * 获取或创建与目标用户的私聊会话
 */
export async function startConversation(targetUserId: string, token: string): Promise<{ roomId: string }> {
  const response = await fetch(`${API_BASE}/api/chat/conversation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ targetUserId })
  });

  if (!response.ok) {
    throw new Error('Failed to start conversation');
  }

  return await response.json();
}

/**
 * 获取我的私聊列表
 */
export async function getConversations(token: string): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE}/api/chat/conversations`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return [];
  }

  return await response.json();
}
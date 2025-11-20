// packages/juglans-app/src/components/live-chat/socket.ts
import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const socket: Socket = io(URL, {
  autoConnect: false,
});

export interface ChatMessage {
  // --- 核心修改：ID 改为 number，增加 tempId ---
  id: number; 
  tempId?: string; // 用于乐观更新去重
  
  room: string;
  author: string;
  content: string;
  timestamp: number;
  isMe?: boolean;
  avatar?: string; 
  nickname?: string;
  
  type?: 'text' | 'asset';
  metadata?: {
    symbol: string;
    assetType: 'stock' | 'crypto';
  };
}

export const joinRoom = (room: string) => {
  if (socket.connected) {
    socket.emit('join_room', room);
  }
};

export const leaveRoom = (room: string) => {
  if (socket.connected) {
    socket.emit('leave_room', room);
  }
};

export const sendMessage = (messageData: any) => {
  if (socket.connected) {
    socket.emit('send_message', messageData);
  }
};

export const fetchHistory = (room: string, beforeTimestamp: number) => {
  if (socket.connected) {
    socket.emit('fetch_history', { room, beforeTimestamp });
  }
};

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server');
});
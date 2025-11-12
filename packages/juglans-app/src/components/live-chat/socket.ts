// packages/juglans-app/src/components/live-chat/socket.ts
import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const socket = io(URL, {
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server');
});
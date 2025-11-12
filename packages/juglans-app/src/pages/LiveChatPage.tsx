// packages/juglans-app/src/pages/LiveChatPage.tsx
import { Component, createEffect } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useAppContext } from '@/context/AppContext';
import { useEditor } from '@/context/EditorContext';
// 导入我们刚刚创建的 socket 服务
import { socket } from '@/components/live-chat/socket';

const LiveChatPage: Component = () => {
  const params = useParams();
  const username = () => decodeURIComponent(params.username);

  // 确保 socket 连接
  createEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  });

  return (
    <div style={{ padding: '24px', color: 'white', height: '100%' }}>
      <h1 style={{ "margin-top": '0' }}>Live Chat</h1>
      <p>
        You are in the chat channel for: 
        <strong style={{ color: 'var(--primary-highlight)', "margin-left": "8px" }}>
          {username()}
        </strong>
      </p>
      <p>Socket ID: {socket.id}</p>
      {/* 在这里可以继续开发完整的聊天界面 */}
    </div>
  );
};

export default LiveChatPage;
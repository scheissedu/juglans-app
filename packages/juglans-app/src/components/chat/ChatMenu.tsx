// /klinecharts-workspace/packages/preview/src/ChatMenu.tsx

import { Component, Show } from 'solid-js';
import './ChatMenu.css';

interface ChatMenuProps {
  onClear: () => void;
  onExport: () => void;
}

const ChatMenu: Component<ChatMenuProps> = (props) => {
  return (
    <div class="chat-menu-dropdown">
      <button class="chat-menu-item" onClick={props.onClear}>
        Clear Conversation
      </button>
      <button class="chat-menu-item" onClick={props.onExport}>
        Export Chat
      </button>
    </div>
  );
};

export default ChatMenu;
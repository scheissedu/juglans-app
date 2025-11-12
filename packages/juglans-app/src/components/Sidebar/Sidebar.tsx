// packages/juglans-app/src/components/Sidebar/Sidebar.tsx
import { Component, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { Portal } from 'solid-js/web';
import { useAppContext } from '../../context/AppContext';

import './Sidebar.css';
import CloseIcon from '../icons/CloseIcon';
import HomeIcon from '../icons/HomeIcon';
import SearchIcon from '../icons/SearchIcon';
import ExchangeIcon from '../icons/ExchangeIcon';
import WalletIcon from '../icons/WalletIcon';
import NewsIcon from '../icons/NewsIcon';
import ChatIcon from '../icons/ChatIcon'; // 1. 导入新的聊天图标
import BookIcon from '../icons/BookIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/search', label: 'Search', icon: SearchIcon },
  { path: '/market', label: 'Market', icon: ExchangeIcon },
  { path: '/wallet', label: 'Wallet', icon: WalletIcon },
  { path: '/news', label: 'News', icon: NewsIcon },
  { path: '/tutorials', label: 'Tutorials', icon: BookIcon },
];

// 2. 创建一个模拟的聊天频道列表
const liveChatChannels = [
  { id: '@general', name: 'General' },
  { id: '@trading-ideas', name: 'Trading Ideas' },
  { id: '@dev-team', name: 'Dev Team' },
];

const Sidebar: Component<SidebarProps> = (props) => {
  const [state] = useAppContext();

  const userInitial = () => state.user?.username.charAt(0).toUpperCase() ?? '';

  return (
    <Portal>
      <div class={`sidebar-overlay ${props.isOpen ? 'open' : ''}`} onClick={props.onClose} />
      <nav class={`sidebar-nav ${props.isOpen ? 'open' : ''}`}>
        <div class="sidebar-header">
          <img src="/logo.svg" alt="Juglans Logo" class="sidebar-logo" />
          <button class="iconButton" onClick={props.onClose}>
            <CloseIcon class="icon" />
          </button>
        </div>

        <ul class="sidebar-nav-list">
          <For each={navItems}>
            {(item) => (
              <li class="nav-item">
                <A href={item.path} onClick={props.onClose}>
                  <item.icon class="nav-icon" />
                  <span>{item.label}</span>
                </A>
              </li>
            )}
          </For>
        </ul>

        {/* 3. 添加新的聊天列表部分 */}
        <div class="sidebar-divider" />
        <h3 class="sidebar-group-title">Live Chat</h3>
        <ul class="sidebar-nav-list">
          <For each={liveChatChannels}>
            {(channel) => (
              <li class="nav-item">
                <A href={`/live-chat/${channel.id}`} onClick={props.onClose}>
                  <ChatIcon class="nav-icon" />
                  <span>{channel.name}</span>
                </A>
              </li>
            )}
          </For>
        </ul>
        
        <div class="sidebar-banner" />

        <div class="sidebar-footer">
          <Show when={state.user} keyed>
            {(user) => (
              <div class="user-profile">
                <div class="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                  <div class="username">{user.username}</div>
                  <div class="plan">Free</div>
                </div>
              </div>
            )}
          </Show>
          <button class="upgrade-button" onClick={() => alert('Mock: Upgrade plan.')}>Upgrade</button>
        </div>
      </nav>
    </Portal>
  );
};

export default Sidebar;
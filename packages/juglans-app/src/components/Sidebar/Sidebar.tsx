// packages/juglans-app/src/components/Sidebar/Sidebar.tsx
import { Component, For, Show, createResource, onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { A, useNavigate, useLocation } from '@solidjs/router';
import { Portal } from 'solid-js/web';
import { useAppContext } from '../../context/AppContext';
import { getConversations } from '../../api/chatApi';
import { socket } from '../live-chat/socket';

import './Sidebar.css';
import CloseIcon from '../icons/CloseIcon';
import HomeIcon from '../icons/HomeIcon';
import SearchIcon from '../icons/SearchIcon';
import ExchangeIcon from '../icons/ExchangeIcon';
import WalletIcon from '../icons/WalletIcon';
import NewsIcon from '../icons/NewsIcon';
import ChatIcon from '../icons/ChatIcon';
import BookIcon from '../icons/BookIcon';
import UserIcon from '../icons/UserIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/search', label: 'Search', icon: SearchIcon },
  { path: '/market', label: 'Market', icon: ExchangeIcon },
  // --- 核心修改: Label 改为 Portfolio, 路径改为 /portfolio ---
  { path: '/portfolio', label: 'Portfolio', icon: WalletIcon },
  { path: '/news', label: 'News', icon: NewsIcon },
  { path: '/tutorials', label: 'Tutorials', icon: BookIcon },
];

const liveChatChannels = [
  { id: '@general', name: 'General' },
  { id: '@trading-ideas', name: 'Trading Ideas' },
  { id: '@dev-team', name: 'Dev Team' },
];

const Sidebar: Component<SidebarProps> = (props) => {
  const [state] = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLiveChatExpanded, setLiveChatExpanded] = createSignal(false);
  const [isDmExpanded, setDmExpanded] = createSignal(false);

  const userInitial = () => state.user?.username.charAt(0).toUpperCase() ?? '';

  const handleProfileClick = () => {
    navigate('/profile');
    props.onClose();
  };

  const [conversations, { refetch }] = createResource(
    () => state.token,
    async (token) => {
      if (!token) return [];
      return getConversations(token);
    }
  );

  onMount(() => {
    const handleDmUpdate = () => {
      refetch();
    };
    socket.on('dm_update', handleDmUpdate);
    onCleanup(() => socket.off('dm_update', handleDmUpdate));
  });

  createEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/live-chat/dm_')) {
      refetch();
      setDmExpanded(true);
    } else if (path.startsWith('/live-chat/')) {
      setLiveChatExpanded(true);
    }
  });

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

        <div class="sidebar-divider" />
        
        <div class="sidebar-group-header" onClick={() => setLiveChatExpanded(!isLiveChatExpanded())}>
          <h3 class="sidebar-group-title">Live Chat</h3>
          <svg 
            class={`group-arrow ${isLiveChatExpanded() ? 'expanded' : ''}`} 
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
        
        <Show when={isLiveChatExpanded()}>
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
        </Show>

        <Show when={conversations() && conversations()!.length > 0}>
          <div class="sidebar-divider" />
          <div class="sidebar-group-header" onClick={() => setDmExpanded(!isDmExpanded())}>
            <h3 class="sidebar-group-title">Direct Messages</h3>
            <svg 
              class={`group-arrow ${isDmExpanded() ? 'expanded' : ''}`} 
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <Show when={isDmExpanded()}>
            <ul class="sidebar-nav-list">
              <For each={conversations()}>
                {(conv) => (
                  <li class="nav-item">
                    <A href={`/live-chat/${conv.roomId}`} onClick={props.onClose}>
                      <div style={{ width: '20px', height: '20px', "border-radius": "50%", overflow: "hidden", "background-color": "#333", display: "flex", "align-items": "center", "justify-content": "center", "flex-shrink": "0" }}>
                        <Show when={conv.otherUser.avatar} fallback={<UserIcon class="nav-icon" />}>
                          <img src={conv.otherUser.avatar!} style={{ width: '100%', height: '100%', "object-fit": "cover" }} />
                        </Show>
                      </div>
                      <div style={{ display: 'flex', 'flex-direction': 'column', overflow: 'hidden' }}>
                          <span style={{ "font-size": "14px" }}>{conv.otherUser.nickname || conv.otherUser.username}</span>
                          <span style={{ "font-size": "11px", color: "var(--light-gray)", "white-space": "nowrap", "overflow": "hidden", "text-overflow": "ellipsis" }}>
                            {conv.lastMessage}
                          </span>
                      </div>
                    </A>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Show>
        
        <div class="sidebar-banner" />

        <div class="sidebar-footer">
          <Show when={state.user} keyed>
            {(user) => (
              <div class="user-profile user-profile-clickable" onClick={handleProfileClick}>
                <Show when={user.avatar} fallback={<div class="user-avatar">{userInitial()}</div>}>
                  <img src={user.avatar} alt={user.username} class="user-avatar-img" />
                </Show>
                <div class="user-info">
                  <div class="username">{user.nickname || user.username}</div>
                  <div class="plan">Pro</div>
                </div>
              </div>
            )}
          </Show>
          <div class="pro-badge">PRO</div>
        </div>
      </nav>
    </Portal>
  );
};

export default Sidebar;
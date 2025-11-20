// packages/juglans-app/src/pages/LiveChatPage.tsx
import { Component, createEffect, createSignal, onCleanup, For, Show, onMount, createMemo, createResource } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { createStore, produce } from 'solid-js/store';
import { useAppContext } from '@/context/AppContext';
import { socket, joinRoom, leaveRoom, sendMessage, fetchHistory, ChatMessage } from '@/components/live-chat/socket';
import { getConversations } from '@/api/chatApi';
import { chatStore, addMessageToChannel, setChannelHistory, prependChannelHistory } from '@/store/chatStore';

import SendIcon from '@/components/icons/SendIcon';
import PlusIcon from '@/components/icons/PlusIcon';
import EllipsisIcon from '@/components/icons/EllipsisIcon';
import RightArrowIcon from '@/components/icons/RightArrowIcon';
import UserIcon from '@/components/icons/UserIcon';
import AssetMessageCard from '@/components/live-chat/AssetMessageCard';
import CustomModal from '@/components/modals/CustomModal';
import AssetIcon from '@/components/icons/AssetIcon';

import './LiveChatPage.css';

const CHANNELS = [
  { id: 'general', name: 'General', timestamp: '09:30' },
  { id: 'trading-ideas', name: 'Trading Ideas', timestamp: 'Yesterday' },
  { id: 'crypto-talk', name: 'Crypto Talk', timestamp: 'Monday' },
  { id: 'dev-team', name: 'Dev Team', timestamp: 'Sunday' },
];

const POPULAR_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' as const },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' as const },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' as const },
  { symbol: 'AAPL', name: 'Apple', type: 'stock' as const },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock' as const },
  { symbol: 'SOL', name: 'Solana', type: 'crypto' as const },
];

const ChatSkeletonLoader = () => (
  <div style={{ padding: "20px", display: "flex", "flex-direction": "column" }}>
    <div class="msg-skeleton-wrapper">
      <div class="skeleton msg-skeleton-avatar"></div>
      <div class="msg-skeleton-content">
        <div class="skeleton msg-skeleton-meta"></div>
        <div class="skeleton msg-skeleton-bubble long"></div>
      </div>
    </div>
    <div class="msg-skeleton-wrapper right">
      <div class="skeleton msg-skeleton-avatar"></div>
      <div class="msg-skeleton-content">
        <div class="skeleton msg-skeleton-meta"></div>
        <div class="skeleton msg-skeleton-bubble short"></div>
      </div>
    </div>
    <div class="msg-skeleton-wrapper">
      <div class="skeleton msg-skeleton-avatar"></div>
      <div class="msg-skeleton-content">
        <div class="skeleton msg-skeleton-meta"></div>
        <div class="skeleton msg-skeleton-bubble"></div>
      </div>
    </div>
  </div>
);

const SidebarSkeletonLoader = () => (
  <>
    <div class="sidebar-skeleton-item">
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-line-title"></div>
        <div class="skeleton skeleton-line-subtitle"></div>
      </div>
    </div>
    <div class="sidebar-skeleton-item">
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-line-title"></div>
        <div class="skeleton skeleton-line-subtitle"></div>
      </div>
    </div>
  </>
);


const LiveChatPage: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [state] = useAppContext();
  
  const channelId = () => (decodeURIComponent(params.channelId || 'general'));
  const isDm = createMemo(() => channelId().startsWith('dm_'));

  // 使用全局 Store
  const messages = createMemo(() => chatStore.channels[channelId()]?.messages || []);
  const hasMore = createMemo(() => chatStore.channels[channelId()]?.hasMore ?? true);
  
  const [inputValue, setInputValue] = createSignal('');
  const [isLoadingMore, setIsLoadingMore] = createSignal(false);
  const [isChannelLoading, setIsChannelLoading] = createSignal(true);
  const [isConnected, setIsConnected] = createSignal(socket.connected);
  
  const [dmTargetName, setDmTargetName] = createSignal('Direct Message');
  const [dmTargetAvatar, setDmTargetAvatar] = createSignal<string | null>(null);

  const [isAssetModalOpen, setAssetModalOpen] = createSignal(false);
  const [isDetailsOpen, setDetailsOpen] = createSignal(false);

  let messagesEndRef: HTMLDivElement | undefined;
  let messagesContainerRef: HTMLDivElement | undefined;

  const currentUsername = () => state.user?.username || `Guest_${Math.floor(Math.random() * 1000)}`;
  const currentUserAvatar = () => state.user?.avatar;

  const [conversations, { refetch: refetchConversations }] = createResource(
    () => state.token,
    async (token) => {
      if (!token) return [];
      return getConversations(token);
    }
  );

  onMount(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (state.user?.id) {
      socket.emit('identify', state.user.id);
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const handleDmUpdate = () => refetchConversations();

    const handleReceiveMessage = (data: ChatMessage) => {
      const processedMsg = { ...data, isMe: data.author === currentUsername() };
      
      addMessageToChannel(data.room, processedMsg);

      if (data.room === channelId()) {
        const isAtBottom = messagesContainerRef ? 
          (messagesContainerRef.scrollHeight - messagesContainerRef.scrollTop - messagesContainerRef.clientHeight < 100) : true;
        
        if (isDm() && !processedMsg.isMe) {
           setDmTargetName(data.nickname || data.author);
           if (data.avatar) setDmTargetAvatar(data.avatar);
        }
        
        if (isChannelLoading()) setIsChannelLoading(false);
        if (isAtBottom) scrollToBottom();
      }
    };

    // --- 核心修复：兼容旧格式（数组）和新格式（对象） ---
    const handleInitialHistory = (data: any) => {
      let room = channelId();
      let history: ChatMessage[] = [];

      // 1. 判断数据格式
      if (Array.isArray(data)) {
        // 兼容旧后端：直接返回消息数组
        history = data;
      } else if (data && Array.isArray(data.messages)) {
        // 新后端：包含 room 和 messages
        room = data.room || room;
        history = data.messages;
      } else {
        console.warn("[LiveChat] Received invalid initial history data:", data);
        history = [];
      }

      const processedHistory = history.map(msg => ({ ...msg, isMe: msg.author === currentUsername() }));
      
      // 使用提取的 room 进行存储
      setChannelHistory(room, processedHistory, history.length >= 50);

      // 如果数据属于当前房间，更新 UI
      if (room === channelId()) {
        setIsChannelLoading(false);
        scrollToBottom();
        
        if (isDm() && processedHistory.length > 0) {
            const otherMsg = processedHistory.find(m => !m.isMe);
            if (otherMsg) {
               setDmTargetName(otherMsg.nickname || otherMsg.author);
               if (otherMsg.avatar) setDmTargetAvatar(otherMsg.avatar);
            }
        }
      }
    };

    // --- 核心修复：兼容旧格式（数组）和新格式（对象） ---
    const handleMoreHistory = (data: any) => {
      if (!messagesContainerRef) return;
      
      let room = channelId();
      let history: ChatMessage[] = [];

      if (Array.isArray(data)) {
        history = data;
      } else if (data && Array.isArray(data.messages)) {
        room = data.room || room;
        history = data.messages;
      } else {
        console.warn("[LiveChat] Received invalid history segment data:", data);
        history = [];
      }

      const processedHistory = history.map(msg => ({ ...msg, isMe: msg.author === currentUsername() }));
      prependChannelHistory(room, processedHistory);

      if (room === channelId()) {
         requestAnimationFrame(() => {
            if (messagesContainerRef) {
              // 简单的滚动位置保持 (不是很精确，但可用)
              // 更好的方式是计算添加前后的高度差，这里利用浏览器的默认行为
            }
         });
         setIsLoadingMore(false);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('load_history', handleInitialHistory);
    socket.on('history_segment_loaded', handleMoreHistory);
    socket.on('dm_update', handleDmUpdate);

    onCleanup(() => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('load_history', handleInitialHistory);
      socket.off('history_segment_loaded', handleMoreHistory);
      socket.off('dm_update', handleDmUpdate);
    });
  });

  createEffect(() => {
    const currentRoom = channelId();
    const connected = isConnected();

    if (connected && currentRoom) {
      // 检查缓存
      const cachedMsgs = chatStore.channels[currentRoom]?.messages;
      
      if (cachedMsgs && cachedMsgs.length > 0) {
        setIsChannelLoading(false);
        scrollToBottom();
      } else {
        setIsChannelLoading(true);
      }

      setIsLoadingMore(false);
      
      if (isDm()) {
        const conv = conversations()?.find(c => c.roomId === currentRoom);
        if (conv) {
           setDmTargetName(conv.otherUser.nickname || conv.otherUser.username);
           setDmTargetAvatar(conv.otherUser.avatar);
        } else if (cachedMsgs) {
           const otherMsg = cachedMsgs.find(m => m.author !== currentUsername());
           if (otherMsg) {
             setDmTargetName(otherMsg.nickname || otherMsg.author);
             if (otherMsg.avatar) setDmTargetAvatar(otherMsg.avatar);
           } else {
             setDmTargetName('Direct Message');
             setDmTargetAvatar(null);
           }
        }
      }
      
      joinRoom(currentRoom);
      onCleanup(() => leaveRoom(currentRoom));
    }
  });

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0 && !isLoadingMore() && hasMore() && messages().length > 0) {
      setIsLoadingMore(true);
      const oldestMessage = messages()[0];
      fetchHistory(channelId(), oldestMessage.timestamp);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef?.scrollIntoView({ behavior: 'auto' }), 0);
  };

  const sendMessageInternal = (content: string, type: 'text' | 'asset' = 'text', metadata?: any) => {
    const tempIdStr = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const messageData: any = {
      id: Date.now(), 
      tempId: tempIdStr,
      room: channelId(),
      author: currentUsername(),
      avatar: currentUserAvatar(),
      userId: state.user?.id,
      content: content,
      timestamp: Date.now(),
      type: type,
      metadata: metadata,
      isMe: true
    };

    addMessageToChannel(channelId(), messageData);
    scrollToBottom();
    sendMessage(messageData);
  };

  const handleSend = () => {
    const content = inputValue().trim();
    if (!content) return;
    sendMessageInternal(content);
    setInputValue('');
  };

  const handleSendAsset = (symbol: string, assetType: 'stock' | 'crypto') => {
    sendMessageInternal(`Shared ${symbol}`, 'asset', { symbol, assetType });
    setAssetModalOpen(false);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAvatarClick = (username: string) => {
    navigate(`/u/${username}`);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div class="live-chat-container">
        <div class="channels-sidebar">
          <div class="sidebar-scroll-area">
             <For each={CHANNELS}>
               {(channel) => (
                 <div 
                   class="chat-list-item" 
                   classList={{ active: channelId() === channel.id }}
                   onClick={() => navigate(`/live-chat/${channel.id}`)}
                 >
                   <div class="item-avatar official">
                     <img src="/logo.svg" alt="Official" />
                   </div>
                   <div class="item-content">
                     <div class="item-top">
                       <span class="item-title">{channel.name}</span>
                       <span class="item-time">{channel.timestamp}</span>
                     </div>
                     <div class="item-bottom">
                       <span class="item-msg-preview">Official channel</span>
                     </div>
                   </div>
                 </div>
               )}
             </For>

             <Show when={!conversations.loading} fallback={<SidebarSkeletonLoader />}>
               <Show when={conversations() && conversations()!.length > 0}>
                 <For each={conversations()}>
                   {(conv) => (
                     <div 
                        class="chat-list-item"
                        classList={{ active: channelId() === conv.roomId }}
                        onClick={() => navigate(`/live-chat/${conv.roomId}`)}
                     >
                        <div class="item-avatar">
                           <Show when={conv.otherUser.avatar} fallback={<UserIcon class="nav-icon" style={{color: '#999', width: '24px'}} />}>
                             <img src={conv.otherUser.avatar!} />
                           </Show>
                        </div>
                        <div class="item-content">
                          <div class="item-top">
                            <span class="item-title">{conv.otherUser.nickname || conv.otherUser.username}</span>
                            <span class="item-time">{formatTime(conv.lastMessageAt)}</span>
                          </div>
                          <div class="item-bottom">
                            <span class="item-msg-preview">{conv.lastMessage}</span>
                          </div>
                        </div>
                     </div>
                   )}
                 </For>
               </Show>
             </Show>
          </div>
        </div>

        <div class="chat-main">
          <div class="chat-header">
            <div class="header-title">
              {isDm() ? (
                 <span>{dmTargetName()}</span>
              ) : (
                 <>
                   <span style={{color: "var(--light-gray)", "margin-right": "4px"}}>#</span> 
                   <span>{CHANNELS.find(c => c.id === channelId())?.name || channelId()}</span>
                 </>
              )}
            </div>
            <div class="header-actions">
              <button class="header-btn" onClick={() => setDetailsOpen(true)}>
                <EllipsisIcon />
              </button>
            </div>
          </div>

          <div class="messages-area" ref={messagesContainerRef} onScroll={handleScroll}>
            
            <Show when={!isChannelLoading()} fallback={<ChatSkeletonLoader />}>
              <Show when={isLoadingMore()}>
                <div style={{ "text-align": "center", padding: "10px", color: "var(--light-gray)", "font-size": "12px" }}>
                  Loading history...
                </div>
              </Show>

              <Show when={messages().length === 0}>
                <div style={{ "text-align": "center", color: "var(--light-gray)", "margin-top": "40px" }}>
                  <Show when={isDm()} fallback={<>Welcome to #{channelId()}! <br/> Be the first to say hello. 👋</>}>
                    Start a private conversation. 👋
                  </Show>
                </div>
              </Show>

              <For each={messages()}>
                {(msg) => (
                  <div class="chat-msg" classList={{ me: msg.isMe }}>
                    <Show when={!msg.isMe}>
                      <div class="msg-avatar" onClick={() => handleAvatarClick(msg.author)}>
                        <Show when={msg.avatar} fallback={msg.author.charAt(0).toUpperCase()}>
                           <img src={msg.avatar} alt={msg.author} />
                        </Show>
                      </div>
                    </Show>
                    <div class="msg-content-wrapper">
                      <div class="msg-meta">
                        <Show when={!msg.isMe}>
                          <span style={{ cursor: 'pointer', "font-weight": "500" }} onClick={() => handleAvatarClick(msg.author)}>
                            {msg.nickname || msg.author}
                          </span>
                        </Show>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div class="msg-bubble" classList={{ 'asset-content': msg.type === 'asset' }}>
                         <Show when={msg.type === 'asset' && msg.metadata} fallback={msg.content}>
                            <AssetMessageCard symbol={msg.metadata!.symbol} assetType={msg.metadata!.assetType} />
                         </Show>
                      </div>
                    </div>
                  </div>
                )}
              </For>
              <div ref={messagesEndRef} />
            </Show>
          </div>

          <div class="chat-input-area">
            <button class="livechat-action-btn" onClick={() => setAssetModalOpen(true)}>
              <PlusIcon />
            </button>
            <input 
              class="chat-input" 
              placeholder={isDm() ? `Message ${dmTargetName()}` : `Message #${CHANNELS.find(c => c.id === channelId())?.name || channelId()}`}
              value={inputValue()}
              onInput={(e) => setInputValue(e.currentTarget.value)}
              onKeyDown={handleKeyPress}
              disabled={isChannelLoading()} 
            />
            <button class="chat-send-btn" onClick={handleSend} disabled={!inputValue().trim() || isChannelLoading()}>
              <SendIcon />
            </button>
          </div>

          <Show when={isDetailsOpen()}>
             <div class="chat-drawer-overlay" onClick={() => setDetailsOpen(false)}></div>
          </Show>
          <div class="chat-drawer" classList={{ open: isDetailsOpen() }}>
             <div class="drawer-content">
               <div class="drawer-members-grid">
                 <Show when={isDm()} fallback={
                   <>
                     <div class="drawer-member">
                       <div class="drawer-avatar"><img src={state.user?.avatar || ''} /></div>
                       <span class="drawer-name">Me</span>
                     </div>
                     <div class="drawer-member">
                       <div class="drawer-avatar" style={{"background-color": "#555"}}></div>
                       <span class="drawer-name">Admin</span>
                     </div>
                   </>
                 }>
                   <div class="drawer-member">
                     <div class="drawer-avatar" onClick={() => dmTargetName() !== 'Direct Message' && navigate(`/u/${dmTargetName()}`)}>
                       <Show when={dmTargetAvatar()} fallback={<UserIcon style={{width: '100%', height: '100%', color: '#999'}} />}>
                         <img src={dmTargetAvatar()!} />
                       </Show>
                     </div>
                     <span class="drawer-name">{dmTargetName()}</span>
                   </div>
                 </Show>
                 <div class="drawer-member">
                    <div class="drawer-avatar drawer-avatar-add">
                      <PlusIcon style={{width: '20px'}} />
                    </div>
                 </div>
               </div>

               <div class="drawer-menu-item">
                 <span class="menu-label">Search Chat History</span>
                 <RightArrowIcon class="menu-icon" />
               </div>
               <div class="drawer-menu-item">
                 <span class="menu-label">Mute Notifications</span>
                 <div class="toggle-switch"></div>
               </div>
               <div class="drawer-menu-item">
                 <span class="menu-label">Sticky on Top</span>
                 <div class="toggle-switch on"></div>
               </div>
               
               <div style={{ "flex": "1" }}></div>

               <div class="drawer-btn-danger" onClick={() => { setDetailsOpen(false); }}>
                 Clear Chat History
               </div>
            </div>
          </div>
        </div>
      </div>

      <CustomModal 
        isOpen={isAssetModalOpen()} 
        onClose={() => setAssetModalOpen(false)}
        title="Share an Asset"
      >
        <div style={{ padding: "8px 0" }}>
           <For each={POPULAR_ASSETS}>
             {(asset) => (
               <div class="asset-option" onClick={() => handleSendAsset(asset.symbol, asset.type)}>
                 <AssetIcon symbol={asset.symbol} assetType={asset.type} />
                 <div style={{"font-weight": "600", "flex": "1"}}>{asset.symbol}</div>
                 <div style={{"color": "var(--light-gray)", "font-size": "12px"}}>{asset.name}</div>
               </div>
             )}
           </For>
        </div>
      </CustomModal>
    </>
  );
};

export default LiveChatPage;
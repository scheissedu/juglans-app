// packages/juglans-app/src/pages/ProfilePage.tsx
import { Component, createMemo, Show } from 'solid-js';
import { useAppContext } from '../context/AppContext';
import './ProfilePage.css';

// --- 子组件 ListItem ---
interface ProfileListItemProps {
  label: string;
  value: string;
  action?: string;
  actionText?: string;
  alert?: string;
  onAction?: () => void;
}

const ListItem: Component<ProfileListItemProps> = (props) => {
  const handleCopy = () => { if (props.value) { navigator.clipboard.writeText(props.value); alert('Copied!'); }};
  return (
    <div class="profile-list-item">
      <span class="label">{props.label}</span>
      <div class="value-container">
        <Show when={props.alert}><span class="alert-icon">⚠️</span><span class="alert-text">{props.alert}</span></Show>
        <span class="value">{props.value}</span>
        <Show when={props.action === 'copy'}>
          <button class="copy-btn" onClick={handleCopy}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
        </Show>
        <Show when={props.actionText}>
          <button class="action-text-btn" onClick={props.onAction}>{props.actionText}</button>
        </Show>
      </div>
    </div>
  );
};

const ListGroup: Component<{ title: string; items: ProfileListItemProps[] }> = (props) => (
  <div class="profile-group">
    <h3 class="group-title">{props.title}</h3>
    <For each={props.items}>{(item) => <ListItem {...item} />}</For>
  </div>
);

// --- 主页面 ---
const ProfilePage: Component = () => {
  const [state, actions] = useAppContext();
  let fileInputRef: HTMLInputElement | undefined;

  // --- 核心修复: 使用 createMemo 确保头像源是响应式的 ---
  // 只要 state.user.avatar 变化，avatarSrc 就会更新
  const avatarSrc = createMemo(() => state.user?.avatar || '');

  const handleAvatarClick = () => {
    fileInputRef?.click();
  };

  const handleFileChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      // 这里不再需要手动 setAvatarSrc，因为 actions.setUser 会更新全局状态，从而触发 memo 更新

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
          },
          body: JSON.stringify({ avatar: base64 })
        });
        
        if (response.ok) {
          const updatedUser = await response.json();
          actions.setUser(updatedUser, state.token); // 这会触发 AppContext 更新 -> 触发 avatarSrc 更新
        }
      } catch (err) {
        console.error("Failed to update avatar", err);
        alert("Failed to upload avatar.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNicknameEdit = async () => {
    const currentNickname = state.user?.nickname || state.user?.username;
    const newNickname = prompt("Enter new nickname:", currentNickname);
    if (newNickname && newNickname !== currentNickname) {
       try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
          },
          body: JSON.stringify({ nickname: newNickname })
        });
        
        if (response.ok) {
          const updatedUser = await response.json();
          actions.setUser(updatedUser, state.token);
        }
      } catch (err) {
        console.error("Failed to update nickname", err);
      }
    }
  }

  const username = () => state.user?.username ?? '';
  const nickname = () => state.user?.nickname ?? username();
  
  const accountInfo = () => ({
    uid: state.user?.id.replace('user_', '') ?? '',
    email: `${username().substring(0, 3)}***@gmail.com`, 
    phone: '****287'
  });

  const accountItems = () => [
    { label: '昵称', value: nickname(), actionText: '编辑', onAction: handleNicknameEdit },
    { label: '用户名', value: `@${username()}`, action: 'copy' }, 
    { label: 'UID', value: accountInfo().uid, action: 'copy' },
    { label: '邮箱', value: accountInfo().email, actionText: '编辑' },
    { label: '手机', value: accountInfo().phone, actionText: '编辑' },
  ];

  const verificationItems = [
    { label: '身份认证', value: '', alert: '未认证', actionText: '去认证' },
    { label: '国家/地区', value: '--', actionText: '查看详情' },
  ];
  const tradingItems = [
    { label: '手续费等级', value: '普通用户', actionText: '查看详情' },
  ];

  return (
    <div class="profile-page-wrapper">
      <div class="profile-content-container">
        <h1 class="profile-page-title">个人资料</h1>
        <div class="profile-body">
          <div class="avatar-section">
            <div class="avatar-placeholder" style={{ overflow: 'hidden', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
               <Show 
                  when={avatarSrc()} 
                  fallback={
                    <div style={{ 'font-size': '36px', 'font-weight': 'bold', color: '#fff' }}>
                      {(nickname() || username()).charAt(0).toUpperCase()}
                    </div>
                  }
                >
                 <img src={avatarSrc()} alt="avatar" style={{ width: '100%', height: '100%', "object-fit": "cover" }} />
              </Show>
            </div>
            
            <button class="edit-avatar-btn" onClick={handleAvatarClick}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/png, image/jpeg" 
              onChange={handleFileChange} 
            />
          </div>

          <div class="details-section">
            <ListGroup title="账号信息" items={accountItems()} />
            <ListGroup title="认证详情" items={verificationItems} />
            <ListGroup title="交易信息" items={tradingItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
// packages/juglans-app/src/pages/ProfilePage.tsx

import { Component, For, Show } from 'solid-js';
import { useAppContext } from '../context/AppContext';
import './ProfilePage.css'; // 导入页面专属 CSS

// --- 内部 UI 子组件 ---
interface ProfileListItemProps {
  label: string;
  value: string;
  action?: 'copy';
  actionText?: string;
  alert?: string;
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
          {/* --- 核心修正 1: 换回 SVG 复制图标 --- */}
          <button class="copy-btn" onClick={handleCopy}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
        </Show>
        <Show when={props.actionText}><button class="action-text-btn">{props.actionText}</button></Show>
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


// --- 主页面组件 ---
const ProfilePage: Component = () => {
  const [state] = useAppContext();
  const username = () => state.user?.username ?? '';
  const accountInfo = {
    nickname: username(),
    uid: state.user?.id.replace('user_', ''),
    email: `${username().substring(0, 3)}***@gmail.com`,
    phone: '****287'
  };
  const accountItems = [
    { label: '昵称', value: accountInfo.nickname, actionText: '编辑' },
    { label: 'UID', value: accountInfo.uid, action: 'copy' },
    { label: '邮箱', value: accountInfo.email, actionText: '编辑' },
    { label: '手机', value: accountInfo.phone, actionText: '编辑' },
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
            <div class="avatar-placeholder" />
            {/* --- 核心修正 2: 换回 SVG 编辑图标 --- */}
            <button class="edit-avatar-btn">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
          </div>
          <div class="details-section">
            <ListGroup title="账号信息" items={accountItems} />
            <ListGroup title="认证详情" items={verificationItems} />
            <ListGroup title="交易信息" items={tradingItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
// packages/juglans-app/src/pages/PublicProfilePage.tsx
import { Component, Show, createResource, onMount } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { Loading } from '@klinecharts/pro';
import EmptyState from '@/components/common/EmptyState';
import { useAppContext } from '@/context/AppContext';
import { startConversation } from '@/api/chatApi'; // 导入 API
import ChatIcon from '@/components/icons/ChatIcon'; // 导入图标
import './ProfilePage.css';

interface PublicProfile {
  id: string; // 需要 ID 来发起私聊
  username: string;
  nickname: string;
  uid: string;
  joinDate: string;
  avatar?: string;
  avatarLetter: string;
}

const PublicProfilePage: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [state] = useAppContext();
  const username = () => params.username;

  const [profile] = createResource(username, async (name) => {
    if (!name) return null;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${name}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch profile');
      }
      return await response.json() as PublicProfile;
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // --- 核心修复：处理点击发消息 ---
  const handleMessageClick = async () => {
    const user = profile();
    if (!user || !state.token) {
      alert("Please login to send messages.");
      return;
    }
    
    if (user.username === state.user?.username) {
        alert("You cannot message yourself.");
        return;
    }

    try {
      const { roomId } = await startConversation(user.id, state.token);
      navigate(`/live-chat/${roomId}`);
    } catch (e) {
      console.error("Failed to start conversation:", e);
      alert("Failed to start conversation.");
    }
  };

  return (
    <div class="profile-page-wrapper">
      <Show when={!profile.loading} fallback={<Loading />}>
        <Show 
          when={profile()} 
          fallback={
            <div style={{ color: 'white', padding: '40px' }}>
              <EmptyState message="User not found" subMessage={`The user @${username()} does not exist.`} />
            </div>
          }
        >
          {(user) => (
            <div class="profile-content-container">
              <h1 class="profile-page-title">Public Profile</h1>
              
              <div class="profile-body">
                <div class="avatar-section">
                  <div class="avatar-placeholder" style={{ overflow: 'hidden', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
                    <Show 
                      when={user().avatar} 
                      fallback={
                        <div style={{ 'font-size': '36px', 'font-weight': 'bold', color: '#fff' }}>
                          {user().avatarLetter}
                        </div>
                      }
                    >
                      <img 
                        src={user().avatar} 
                        alt={user().username} 
                        style={{ width: '100%', height: '100%', "object-fit": "cover" }} 
                      />
                    </Show>
                  </div>
                  
                  {/* --- 新增：消息按钮 --- */}
                  <Show when={state.user && state.user.username !== user().username}>
                    <button 
                      onClick={handleMessageClick}
                      style={{
                        "margin-top": "16px",
                        "background-color": "var(--primary-highlight)",
                        "color": "#000",
                        "border": "none",
                        "padding": "8px 24px",
                        "border-radius": "20px",
                        "font-weight": "600",
                        "cursor": "pointer",
                        "display": "flex",
                        "align-items": "center",
                        "gap": "8px",
                        "margin-left": "auto",
                        "margin-right": "auto"
                      }}
                    >
                      <ChatIcon class="icon" style={{width: '18px', height: '18px'}} />
                      Message
                    </button>
                  </Show>

                </div>

                <div class="details-section">
                  <div class="profile-group">
                    <h3 class="group-title">User Info</h3>
                    <div class="profile-list-item">
                      <span class="label">Nickname</span>
                      <div class="value-container">
                        <span class="value" style={{ "font-weight": "600" }}>{user().nickname}</span>
                      </div>
                    </div>
                    <div class="profile-list-item">
                      <span class="label">Username</span>
                      <div class="value-container">
                        <span class="value">@{user().username}</span>
                      </div>
                    </div>
                    <div class="profile-list-item">
                      <span class="label">UID</span>
                      <div class="value-container">
                        <span class="value">{user().uid}</span>
                      </div>
                    </div>
                    <div class="profile-list-item">
                      <span class="label">Member Since</span>
                      <div class="value-container">
                        <span class="value">{formatDate(user().joinDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div class="profile-group">
                    <h3 class="group-title">Stats</h3>
                    <div class="profile-list-item">
                      <span class="label">Reputation</span>
                      <div class="value-container">
                        <span class="value" style={{ color: 'var(--primary-highlight)' }}>Good</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Show>
      </Show>
    </div>
  );
};

export default PublicProfilePage;
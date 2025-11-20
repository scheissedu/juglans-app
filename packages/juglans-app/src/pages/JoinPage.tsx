// packages/juglans-app/src/pages/JoinPage.tsx
import { Component, createSignal, Show } from 'solid-js';
import { useSearchParams, useNavigate } from '@solidjs/router';
import MarketingNavbar from '../components/Navbar/MarketingNavbar'; // 1. 导入新组件
import './JoinPage.css';

const NvidiaIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.33,5.33V9h1.33V5.33H11.33M11.33,10.33v3.67h1.33v-3.67H11.33M5,3H19a2,2,0,0,1,2,2V19a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V5A2,2,0,0,1,5,3M8,5.33V18.67H9.33V5.33H8M14,5.33V18.67h1.33v-6.34h2.33l-2.33-7Z" /></svg>;
const BtcIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18,8H16V5H13V3h3a2,2,0,0,1,2,2V8M13,19v2H16a2,2,0,0,0,2-2V16H16v3H13M6,8V5A2,2,0,0,1,8,3h3V5H8V8H6M8,16H6v3a2,2,0,0,0,2,2h3V19H8V16M14.5,10.75h-1V9.25h1a1,1,0,0,0,1-1V7.5a1,1,0,0,0-1-1h-2.5a1,1,0,0,0-1,1V15a1,1,0,0,0,1,1h2.5a1,1,0,0,0,1-1V13.25a1,1,0,0,0-1-1h-1v-1.5Zm-1,2.25h-1V12h1v1Z" /></svg>;
const TokenIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Zm0-5.5a1,1,0,0,0-1,1v2a1,1,0,0,0,2,0v-2A1,1,0,0,0,12,14.5ZM12,6.5A1.5,1.5,0,0,0,10.5,8v4a1.5,1.5,0,0,0,3,0V8A1.5,1.5,0,0,0,12,6.5Z" /></svg>;

const JoinPage: Component = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = () => searchParams.ref || '';

  const [email, setEmail] = createSignal('');
  const [status, setStatus] = createSignal<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!email() || !/^\S+@\S+\.\S+$/.test(email())) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/waitlist/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email(), refCode: refCode() }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 200) throw new Error(data.error);

      localStorage.setItem('waitlistToken', data.token);
      setStatus('success');
      navigate('/waitlist');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="join-page-container">
      {/* 2. 插入 MarketingNavbar */}
      <MarketingNavbar />

      <div class="join-content-wrapper">
        {/* 3. 移除旧的 logo (Navbar里已经有了，或者可以选择保留作为页面标题的一部分，看视觉效果) */}
        {/* 这里我们暂时保留，作为一个大的 Hero Logo，或者可以注释掉 */}
        <img src="/logo.svg" alt="Juglans Logo" class="join-logo" />
        
        <h1 class="join-headline">Join the Juglans Waitlist</h1>
        <p class="join-tagline">全球第一个 Vibe trading app</p>

        <div class="incentives-list">
          <div class="incentive-item">
            <div class="incentive-icon"><NvidiaIcon /></div>
            <span>获取 <span class="highlight">英伟达(NVDA)</span> 碎股</span>
          </div>
          <div class="incentive-item">
            <div class="incentive-icon"><BtcIcon /></div>
            <span>获取 <span class="highlight">比特币(BTC)</span> 现货</span>
          </div>
          <div class="incentive-item">
            <div class="incentive-icon"><TokenIcon /></div>
            <span>获取独家 <span class="highlight">Juglans Coin</span></span>
          </div>
        </div>

        <p class="join-cta-text">
          加入公测候选名单，即可获得以上所有奖励！
        </p>

        <form class="join-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="输入你的邮箱地址"
            class="join-input"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            disabled={status() === 'loading' || status() === 'success'}
          />
          <button
            type="submit"
            class="join-button"
            classList={{ success: status() === 'success' }}
            disabled={status() === 'loading' || status() === 'success'}
          >
            <Show when={status() === 'idle' || status() === 'error'}>立即加入</Show>
            <Show when={status() === 'loading'}>加入中...</Show>
            <Show when={status() === 'success'}>成功加入！</Show>
          </button>
        </form>

        <Show when={status() === 'error'}>
          <p class="status-message error">{errorMsg()}</p>
        </Show>
        <Show when={status() === 'success'}>
          <p class="status-message success">感谢您的加入！请留意您的邮箱获取后续通知。</p>
        </Show>

        <Show when={refCode()}>
          <p class="ref-code">邀请码: <strong>{refCode()}</strong></p>
        </Show>
      </div>
    </div>
  );
};

export default JoinPage;
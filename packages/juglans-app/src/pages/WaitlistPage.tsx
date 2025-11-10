// packages/juglans-app/src/pages/WaitlistPage.tsx

import { Component, createSignal, onMount, Show } from 'solid-js';
import './JoinPage.css'; // 复用 JoinPage 的大部分样式
import './WaitlistPage.css'; // 添加一些专属样式

interface WaitlistData {
  waitlistId: string;
  email: string;
  referrals: number;
}

const WaitlistPage: Component = () => {
  const [token, setToken] = createSignal(localStorage.getItem('waitlistToken') || '');
  const [inputToken, setInputToken] = createSignal('');
  const [data, setData] = createSignal<WaitlistData | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  const fetchData = async (t: string) => {
    if (!t) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/waitlist/status`, {
        headers: { 'Authorization': `Waitlist ${t}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
      localStorage.setItem('waitlistToken', t);
    } catch (err: any) {
      setError(err.message);
      localStorage.removeItem('waitlistToken');
      setToken('');
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    if (token()) {
      fetchData(token());
    }
  });

  const handleTokenSubmit = () => {
    setToken(inputToken());
    fetchData(inputToken());
  };

  const inviteLink = () => `https://app.juglans.ai/join?ref=${data()?.waitlistId}`;
  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink());
    alert('Invite link copied!');
  };

  return (
    <div class="join-page-container">
      <div class="join-content-wrapper">
        <Show
          when={token() && !loading() && data()}
          fallback={
            <div class="token-prompt">
              <h1 class="join-headline">Check your Waitlist Status</h1>
              <p class="join-cta-text">Enter the access token sent to your email.</p>
              <div class="join-form">
                <input
                  type="text"
                  placeholder="Enter your token..."
                  class="join-input"
                  onInput={(e) => setInputToken(e.currentTarget.value)}
                />
                <button class="join-button" onClick={handleTokenSubmit} disabled={loading()}>
                  {loading() ? 'Checking...' : 'Check Status'}
                </button>
              </div>
              <Show when={error()}><p class="status-message error">{error()}</p></Show>
            </div>
          }
        >
          <img src="/logo.svg" alt="Juglans Logo" class="join-logo" />
          <h1 class="join-headline">You're on the Waitlist!</h1>
          <p class="email-display">{data()!.email}</p>
          
          <div class="waitlist-stats">
            <div class="stat-item">
              <div class="stat-value">{data()!.referrals}</div>
              <div class="stat-label">Friends Referred</div>
            </div>
          </div>
          
          <div class="invite-section">
            <p class="join-cta-text">Move up the list by inviting friends with your unique link!</p>
            <div class="invite-link-wrapper">
              <input type="text" class="join-input" readOnly value={inviteLink()} />
              <button class="copy-link-btn" onClick={copyLink}>Copy</button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default WaitlistPage;
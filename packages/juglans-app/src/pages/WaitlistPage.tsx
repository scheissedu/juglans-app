// packages/juglans-app/src/pages/WaitlistPage.tsx
import { Component, createSignal, createResource, Show, For, createEffect, onMount, onCleanup, createMemo } from 'solid-js';
import { Loading } from '@klinecharts/pro';
import { KLineChartTimeSpan } from '@klinecharts/light';
import AssetHistoryDatafeed from './wallet/AssetHistoryDatafeed';

import { ChatArea } from '../components/chat/ChatArea';
import { useAppContext } from '../context/AppContext';
import { useEditor } from '../context/EditorContext';
import AssetIcon from '@/components/icons/AssetIcon';
import MarketingNavbar from '../components/Navbar/MarketingNavbar';
import './WaitlistPage.css';
import './JoinPage.css';

// ... (接口定义保持不变) ...
interface WaitlistStatus {
  waitlistId: string;
  email: string;
  referrals: number;
  rank: number;
}
interface LeaderboardEntry {
  waitlistId: string;
  referrals: number;
}
interface VestingPosition {
  symbol: string;
  name: string;
  amount: number;
  valueUsd: number;
  assetType: 'stock' | 'crypto';
  progress: number;
  unlockCondition: string;
  customIcon?: string;
}

// ... (常量定义保持不变) ...
const MOCK_VESTING_POSITIONS: VestingPosition[] = [
  {
    symbol: 'JUG',
    name: 'Juglans Coin',
    amount: 888,
    valueUsd: 88.80,
    assetType: 'crypto',
    progress: 100,
    unlockCondition: 'Welcome Bonus',
    customIcon: '/logo.svg'
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    amount: 0.5,
    valueUsd: 62.45,
    assetType: 'stock',
    progress: 25,
    unlockCondition: 'Refer 3 Friends'
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    amount: 0.0005,
    valueUsd: 34.50,
    assetType: 'crypto',
    progress: 10,
    unlockCondition: 'Refer 5 Friends'
  }
];

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UnlockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
  </svg>
);

const vestingDatafeed = new AssetHistoryDatafeed();

// --- 新增: 上线倒计时组件 ---
const LaunchCountdown: Component = () => {
  const startDate = new Date('2025-08-02').getTime();
  const targetDate = new Date('2026-05-01').getTime();
  const now = Date.now();

  const totalDuration = targetDate - startDate;
  const elapsed = now - startDate;
  // 计算进度 (0 - 100)
  const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  
  const daysRemaining = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

  // SVG 圆环参数
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div class="launch-progress-container">
      <div class="launch-circle-wrapper">
        <svg height={radius * 2} width={radius * 2} class="launch-svg">
          <circle
            class="launch-bg-ring"
            stroke-width={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            class="launch-fg-ring"
            stroke-width={stroke}
            stroke-dasharray={`${circumference} ${circumference}`}
            style={{ 'stroke-dashoffset': strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div class="launch-text">
          <span class="launch-days">{daysRemaining}</span>
          <span class="launch-label">D Left</span>
        </div>
      </div>
      <div class="launch-dates">
        <div class="date-item">
            <span>Start</span>
            <strong>Aug 2, 2025</strong>
        </div>
        <div class="date-item">
            <span>Launch</span>
            <strong>May 1, 2026</strong>
        </div>
      </div>
    </div>
  );
};

const WaitlistPage: Component = () => {
  const [token, setToken] = createSignal(localStorage.getItem('waitlistToken') || '');
  const [emailInput, setEmailInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  const [isWideLayout, setIsWideLayout] = createSignal(window.innerWidth > 960);
  const [isChatExpanded, setIsChatExpanded] = createSignal(false);
  const [state, actions] = useAppContext();
  const { editor } = useEditor();

  const [waitlistData] = createResource(token, async (t) => {
    if (!t) return null;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/waitlist/status`, {
        headers: { 'Authorization': `Waitlist ${t}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result as WaitlistStatus;
    } catch (err: any) {
      localStorage.removeItem('waitlistToken');
      setToken('');
      setError(err.message);
      return null;
    }
  });

  const [leaderboardData] = createResource(async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/waitlist/leaderboard`);
        if (!response.ok) return [];
        return (await response.json()) as LeaderboardEntry[];
    } catch {
        return [];
    }
  });

  createEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 961px)');
    const handleResize = () => {
      const isNowWide = mediaQuery.matches;
      setIsWideLayout(isNowWide);
      if (isNowWide) {
        setIsChatExpanded(false);
      }
    };
    handleResize();
    mediaQuery.addEventListener('change', handleResize);
    onCleanup(() => mediaQuery.removeEventListener('change', handleResize));
  });
  
  onMount(() => {
    actions.setChatExtension({
      getContext: () => ({ page: 'waitlist', rank: waitlistData()?.rank }),
      getCommands: () => [],
      handleCommand: () => {},
      getQuickSuggestions: () => [{ text: "How do I move up the list?", sendImmediately: false }],
      getAttachmentActions: () => [],
    });
  });
  onCleanup(() => actions.setChatExtension(null));

  const handleEmailLogin = async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/waitlist/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      localStorage.setItem('waitlistToken', data.token);
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = () => `https://app.juglans.ai/join?ref=${waitlistData()?.waitlistId}`;
  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink());
    alert('Invite link copied!');
  };

  return (
    <div class="waitlist-page-layout">
      <MarketingNavbar />

      <div class="waitlist-page-container">
        <Show
          when={token() && !waitlistData.loading}
          fallback={
            <div class="waitlist-login-prompt">
              <h1 class="join-headline">Check Your Waitlist Status</h1>
              <p class="join-cta-text">Enter your email to see your position and invite friends.</p>
              <form class="join-form" onSubmit={handleEmailLogin}>
                <input type="email" placeholder="Enter your email..." class="join-input" onInput={(e) => setEmailInput(e.currentTarget.value)} />
                <button class="join-button" type="submit" disabled={loading()}>{loading() ? 'Checking...' : 'Continue'}</button>
              </form>
              <Show when={error()}><p class="status-message error">{error()}</p></Show>
            </div>
          }
        >
          <Show when={waitlistData()}>
              <div class="waitlist-header">
                  <h1>Your Waitlist Status</h1>
                  <p>Move up the list by inviting friends. The more you refer, the higher you climb!</p>
              </div>
              
              <div class="waitlist-content">
                  <div class="waitlist-main-column">
                      
                      {/* --- Vesting Positions --- */}
                      <div class="vesting-section">
                        <div class="vesting-header">
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{"color": "var(--primary-highlight)"}}>
                             <path d="M21 12V7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                             <path d="M5 13v4a2 2 0 0 0 2 2h16"></path>
                           </svg>
                           <span>Your Vesting Positions</span>
                        </div>
                        <div class="vesting-grid">
                          <For each={MOCK_VESTING_POSITIONS}>
                            {(pos) => (
                              <div class="vesting-card">
                                <div class="vesting-card-header">
                                  <div class="vesting-icon-wrapper">
                                    <Show 
                                      when={pos.customIcon} 
                                      fallback={<AssetIcon symbol={pos.symbol} assetType={pos.assetType} />}
                                    >
                                      <img src={pos.customIcon} alt={pos.name} class="custom-vesting-icon" />
                                    </Show>
                                  </div>
                                  <div class="vesting-asset-info">
                                    <span class="vesting-symbol">{pos.symbol}</span>
                                    <span class="vesting-name">{pos.name}</span>
                                  </div>
                                </div>
                                
                                <div class="vesting-amount-row">
                                  <div class="vesting-amount">
                                    {pos.assetType === 'stock' ? pos.amount.toFixed(2) : pos.amount.toFixed(4)} {pos.symbol}
                                  </div>
                                  <div class="vesting-amount-usd">
                                    ≈ ${pos.valueUsd.toFixed(2)} USD
                                  </div>
                                </div>

                                <div class="vesting-chart">
                                  <KLineChartTimeSpan
                                    container=""
                                    symbol={pos.symbol}
                                    period={{ text: '1M', multiplier: 1, timespan: 'month' }}
                                    datafeed={vestingDatafeed}
                                  />
                                </div>

                                <div class="vesting-progress-section">
                                  <div class="progress-label-row">
                                    <span>Status: {pos.progress === 100 ? 'Available' : 'Vesting'}</span>
                                    <span>{pos.progress}%</span>
                                  </div>
                                  <div class="progress-bar-bg">
                                    <div 
                                      class="progress-bar-fill" 
                                      style={{ width: `${pos.progress}%` }}
                                      classList={{ 'completed': pos.progress === 100 }}
                                    ></div>
                                  </div>
                                </div>

                                <button 
                                  class="activate-btn" 
                                  classList={{ 'locked': pos.progress < 100, 'active': pos.progress === 100 }}
                                  disabled={pos.progress < 100}
                                >
                                  <Show when={pos.progress === 100} fallback={<LockIcon />}>
                                    <UnlockIcon />
                                  </Show>
                                  {pos.progress === 100 ? 'Claim Now' : `Activate (${pos.unlockCondition})`}
                                </button>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>

                      {/* --- 新增: 底部三栏布局 --- */}
                      <div class="waitlist-bottom-grid">
                        
                        {/* Left: Launch Progress */}
                        <div class="waitlist-card launch-card">
                          <h2>Time to Launch</h2>
                          <LaunchCountdown />
                        </div>

                        {/* Center: Your Progress */}
                        <div class="waitlist-card progress-card">
                          <h2>Your Progress</h2>
                          <div class="my-stats-grid">
                              <div class="stat-item">
                                <div class="stat-value">{waitlistData()?.rank ?? '--'}</div>
                                <div class="stat-label">Your Rank</div>
                              </div>
                              <div class="stat-item">
                                <div class="stat-value">{waitlistData()?.referrals ?? 0}</div>
                                <div class="stat-label">Friends Referred</div>
                              </div>
                          </div>
                          <div class="invite-link-wrapper">
                              <input type="text" class="invite-link-input" readOnly value={inviteLink()} />
                              <button class="copy-link-btn" onClick={copyLink}>Copy</button>
                          </div>
                        </div>

                        {/* Right: Leaderboard */}
                        <div class="waitlist-card leaderboard-card">
                          <h2>Top 5 Leaders</h2>
                          <Show when={!leaderboardData.loading} fallback={<Loading />}>
                            <div class="leaderboard-list">
                              {/* 限制显示前5名 */}
                              <For each={leaderboardData()?.slice(0, 5)}>
                                {(entry, i) => (
                                <div class="leaderboard-item">
                                    <span class="leaderboard-rank" classList={{'top-3': i() < 3}}>#{i() + 1}</span>
                                    <span class="leaderboard-name">{entry.waitlistId}</span>
                                    <span class="leaderboard-referrals">{entry.referrals} refs</span>
                                </div>
                                )}
                              </For>
                            </div>
                          </Show>
                        </div>

                      </div>
                  </div>
              </div>
          </Show>
        </Show>
      </div>
      <div class="waitlist-chat-wrapper" classList={{ 'expanded': isChatExpanded() && !isWideLayout() }}>
        <ChatArea isWide={isWideLayout()} isExpanded={isChatExpanded()} onToggle={setIsChatExpanded} />
      </div>
    </div>
  );
};

export default WaitlistPage;
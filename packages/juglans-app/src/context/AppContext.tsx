// packages/juglans-app/src/context/AppContext.tsx
import { createContext, useContext, Component, ParentProps, onMount, createSignal } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import type { ChartPro, BrokerAPI, Period, AccountInfo, Position, Order } from '@klinecharts/pro';
import { Instrument } from '@/instruments';
import type { ChartProLight } from '@klinecharts/light';
import { MockBrokerAPI } from '../api/MockBrokerAPI';
import type { SuggestionItem } from '../components/chat/SuggestionList';
import type { Editor } from '@tiptap/core';

type AnyChart = ChartPro | ChartProLight;

export interface QuickSuggestion {
  text: string;
  sendText?: string;
  sendImmediately: boolean;
}

export interface ChatExtension {
  getContext: () => Record<string, any>;
  getCommands: () => SuggestionItem[];
  handleCommand: (item: SuggestionItem, editor: Editor | null) => void;
  getQuickSuggestions: () => QuickSuggestion[];
  getAttachmentActions: () => Array<{ icon: Component, action: () => void, tooltip: string, label: string }>;
}

export interface ContextSource {
  id: string;
  label: string;
  getContext: () => Promise<Record<string, any>>;
}

export interface AppContextState {
  chart: AnyChart | null;
  brokerApi: BrokerAPI;
  instrument: Instrument;
  period: Period;
  chartMode: 'pro' | 'light';
  chatExtension: ChatExtension | null;
  isAuthenticated: boolean;
  user: { 
    id: string; 
    username: string; 
    nickname?: string; 
    avatar?: string; 
  } | null;
  token: string | null;
  authLoading: boolean;
  watchlist: string[];
  accountInfo: AccountInfo | null;
  positions: Position[];
  orders: Order[];
  availableContexts: ContextSource[];
  enabledContexts: string[];
}

export interface AppContextActions {
  setChart: (chart: AnyChart | null) => void;
  setInstrument: (instrument: Instrument) => void;
  setPeriod: (period: Period) => void;
  setChartMode: (mode: 'pro' | 'light') => void;
  setChatExtension: (extension: ChatExtension | null) => void;
  sendMessage: (text: string) => void;
  navigate: ReturnType<typeof useNavigate>;
  setUser: (user: { id: string; username: string; nickname?: string; avatar?: string } | null, token: string | null) => void;
  logout: () => void;
  toggleWatchlist: (ticker: string) => void;
  setAccountInfo: (info: AccountInfo | null) => void;
  setPositions: (producer: (prev: Position[]) => Position[] | void) => void;
  setOrders: (producer: (prev: Order[]) => Order[] | void) => void;
  registerContextSource: (source: ContextSource) => void;
  unregisterContextSource: (id: string) => void;
  toggleContextEnabled: (id: string) => void;
  buildChatContext: () => Promise<Record<string, any>>;
}

type AppContextValue = [state: AppContextState, actions: AppContextActions];

const AppContext = createContext<AppContextValue>();

export const AppContextProvider: Component<ParentProps> = (props) => {
  const [state, setState] = createStore<AppContextState>({
    chart: null,
    brokerApi: null as unknown as BrokerAPI,
    instrument: new Instrument('CRYPTO:BTC.OKX@USDT_SPOT'),
    period: { multiplier: 1, timespan: 'hour', text: '1H' },
    chartMode: 'pro',
    chatExtension: null,
    isAuthenticated: false,
    user: null,
    token: null,
    authLoading: true,
    watchlist: [],
    accountInfo: null,
    positions: [],
    orders: [],
    availableContexts: [],
    enabledContexts: ['my_context'],
  });

  const [myContextSource] = createSignal<ContextSource>({
    id: 'my_context',
    label: 'My Context (Account, Positions)',
    getContext: async () => ({
        myContext: true,
        accountInfo: state.accountInfo,
        positions: state.positions,
      }),
  });

  const actions: AppContextActions = {
    setChart: (chart) => setState('chart', chart),
    setInstrument: (instrument) => setState('instrument', instrument),
    setPeriod: (period) => setState('period', period),
    setChartMode: (mode) => setState('chartMode', mode),
    setChatExtension: (extension) => setState('chatExtension', extension),
    sendMessage: (text) => document.body.dispatchEvent(new CustomEvent('send-chat-message', { detail: text })),
    navigate: (() => {}) as ReturnType<typeof useNavigate>,
    setUser(user, token) {
      if (user && token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setState({ isAuthenticated: true, user, token });
        if (window.location.pathname === '/login') {
          window.location.href = '/';
        }
      } else {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            setState('user', user);
        }
      }
    },
    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    },
    toggleWatchlist(ticker) {
      setState(produce(s => {
        const index = s.watchlist.indexOf(ticker);
        if (index > -1) s.watchlist.splice(index, 1);
        else s.watchlist.push(ticker);
        localStorage.setItem('juglans_watchlist', JSON.stringify(s.watchlist));
      }));
    },
    setAccountInfo: (info) => setState('accountInfo', info),
    setPositions: (producer) => setState('positions', producer),
    setOrders: (producer) => setState('orders', producer),
    registerContextSource(source) {
      setState(produce(s => {
        if (!s.availableContexts.some(cs => cs.id === source.id)) {
          s.availableContexts.push(source);
          if (source.id !== 'my_context') s.enabledContexts.push(source.id);
        }
      }));
    },
    unregisterContextSource(id) {
      setState(produce(s => {
        s.availableContexts = s.availableContexts.filter(cs => cs.id !== id);
        s.enabledContexts = s.enabledContexts.filter(enabledId => enabledId !== id);
      }));
    },
    toggleContextEnabled(id) {
      setState(produce(s => {
        const index = s.enabledContexts.indexOf(id);
        if (index > -1) s.enabledContexts.splice(index, 1);
        else s.enabledContexts.push(id);
      }));
    },
    async buildChatContext() {
      const finalContext: Record<string, any> = {
        instrument: state.instrument.identifier,
        period: state.period,
      };
      const extensionContext = state.chatExtension?.getContext() ?? {};
      Object.assign(finalContext, extensionContext);
      for (const id of state.enabledContexts) {
        const source = state.availableContexts.find(cs => cs.id === id);
        if (source) {
          try {
            Object.assign(finalContext, await source.getContext());
          } catch (error) {
            console.error(`[Context] Error from source "${id}":`, error);
          }
        }
      }
      return finalContext;
    },
  };

  onMount(() => {
    actions.registerContextSource(myContextSource());
    const savedWatchlist = localStorage.getItem('juglans_watchlist');
    if (savedWatchlist) setState('watchlist', JSON.parse(savedWatchlist));
    
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    let user = null;
    let finalBrokerApi: BrokerAPI;
    
    if (token && userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) { console.error("Failed to parse user from localstorage", e); }
    }
    
    if (user) {
      finalBrokerApi = new MockBrokerAPI(`klinecharts_pro_mock_broker_state_${user.id}`);
      
      // --- 核心修复: 初始化时同步最新的用户信息 (头像等) ---
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch latest user data');
      }).then(latestUser => {
        console.log('[AppContext] User profile synced with server.');
        // 只更新内存和 storage 中的 user 对象，不触发整页重定向
        localStorage.setItem('user', JSON.stringify(latestUser));
        setState('user', latestUser);
      }).catch(err => {
        console.warn('[AppContext] Failed to sync user profile:', err);
      });
      // ------------------------------------------------------

    } else {
      finalBrokerApi = new MockBrokerAPI('default_guest_key');
    }

    setState({
      brokerApi: finalBrokerApi,
      isAuthenticated: !!user,
      user: user,
      token: token,
      authLoading: false
    });
  });

  return (
    <AppContext.Provider value={[state, actions]}>
      {props.children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppContextProvider');
  return context;
}
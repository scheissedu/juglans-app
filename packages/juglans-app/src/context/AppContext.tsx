import { createContext, useContext, Component, ParentProps, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import type { ChartPro, BrokerAPI, SymbolInfo, Period } from '@klinecharts/pro';
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

export interface AppContextState {
  chart: AnyChart | null;
  brokerApi: BrokerAPI;
  symbol: SymbolInfo;
  period: Period;
  chartMode: 'pro' | 'light';
  chatExtension: ChatExtension | null;
  isAuthenticated: boolean;
  user: { id: string; username: string } | null;
  token: string | null;
  authLoading: boolean;
}

export interface AppContextActions {
  setChart: (chart: AnyChart | null) => void;
  setSymbol: (symbol: SymbolInfo) => void;
  setPeriod: (period: Period) => void;
  setChartMode: (mode: 'pro' | 'light') => void;
  setChatExtension: (extension: ChatExtension | null) => void;
  sendMessage: (text: string) => void;
  navigate: ReturnType<typeof useNavigate>;
  setUser: (user: { id: string; username: string } | null, token: string | null) => void;
  logout: () => void;
}

type AppContextValue = [state: AppContextState, actions: AppContextActions];

const AppContext = createContext<AppContextValue>();

export const AppContextProvider: Component<ParentProps> = (props) => {
  const [state, setState] = createStore<AppContextState>({
    chart: null,
    brokerApi: new MockBrokerAPI('default_guest_key'),
    symbol: { ticker: 'BTC-USDT' },
    period: { multiplier: 1, timespan: 'hour', text: '1H' },
    chartMode: 'pro',
    chatExtension: null,
    isAuthenticated: false,
    user: null,
    token: null,
    authLoading: true,
  });

  // --- 核心修复：将 reinitializeBroker 提取出来，避免 this 和循环引用问题 ---
  const reinitializeBroker = (userId: string) => {
    console.log(`[Auth] Reinitializing BrokerAPI for user: ${userId}`);
    const userSpecificKey = `klinecharts_pro_mock_broker_state_${userId}`;
    // 先断开旧连接（如果需要）
    (state.brokerApi as MockBrokerAPI).disconnect();
    // 创建并设置新的 BrokerAPI 实例
    setState('brokerApi', new MockBrokerAPI(userSpecificKey));
  };

  const actions: AppContextActions = {
    setChart: (chart) => setState('chart', chart),
    setSymbol: (symbol) => setState('symbol', symbol),
    setPeriod: (period) => setState('period', period),
    setChartMode: (mode) => setState('chartMode', mode),
    setChatExtension: (extension) => setState('chatExtension', extension),
    sendMessage: (text) => {
      document.body.dispatchEvent(new CustomEvent('send-chat-message', { detail: text }));
    },
    navigate: (() => {}) as ReturnType<typeof useNavigate>,
    
    setUser(user, token) {
      if (user && token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setState({ isAuthenticated: true, user, token });
        reinitializeBroker(user.id);
      }
    },

    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setState({ isAuthenticated: false, user: null, token: null });
      reinitializeBroker('default_guest_key');
      if (actions.navigate) {
        actions.navigate('/login');
      }
    },
  };

  onMount(() => {
    console.log("[AppContext] onMount: Initializing authentication state.");
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        actions.setUser(user, token);
      } catch (e) {
        console.error("[AppContext] Failed to parse user from localStorage.", e);
        actions.logout();
      }
    }
    // 无论如何，最后都要结束加载状态
    setState('authLoading', false);
    console.log("[AppContext] onMount: Authentication check finished.");
  });

  return (
    <AppContext.Provider value={[state, actions]}>
      {props.children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
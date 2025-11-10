// packages/juglans-app/src/context/AppContext.tsx
import { createContext, useContext, Component, ParentProps, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import type { ChartPro, BrokerAPI, SymbolInfo, Period, AccountInfo, Position, Order } from '@klinecharts/pro';
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
  brokerApi: BrokerAPI; // Will be initialized as null but guaranteed to exist after loading
  symbol: SymbolInfo;
  period: Period;
  chartMode: 'pro' | 'light';
  chatExtension: ChatExtension | null;
  isAuthenticated: boolean;
  user: { id: string; username: string } | null;
  token: string | null;
  authLoading: boolean;

  // --- 核心修改 1: 将 BrokerState 合并进来 ---
  accountInfo: AccountInfo | null;
  positions: Position[];
  orders: Order[];
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
  
  // --- 核心修改 2: 添加用于更新 Broker 状态的 actions ---
  setAccountInfo: (info: AccountInfo | null) => void;
  setPositions: (producer: (prev: Position[]) => Position[] | void) => void;
  setOrders: (producer: (prev: Order[]) => Order[] | void) => void;
}

type AppContextValue = [state: AppContextState, actions: AppContextActions];

const AppContext = createContext<AppContextValue>();

export const AppContextProvider: Component<ParentProps> = (props) => {
  const [state, setState] = createStore<AppContextState>({
    chart: null,
    brokerApi: null as unknown as BrokerAPI,
    symbol: { ticker: 'BTC-USDT' },
    period: { multiplier: 1, timespan: 'hour', text: '1H' },
    chartMode: 'pro',
    chatExtension: null,
    isAuthenticated: false,
    user: null,
    token: null,
    authLoading: true,

    // --- 核心修改 3: 初始化合并后的状态 ---
    accountInfo: null,
    positions: [],
    orders: [],
  });

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
        window.location.href = '/';
      }
    },
    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    },

    // --- 核心修改 4: 实现新的 actions ---
    setAccountInfo: (info) => setState('accountInfo', info),
    setPositions: (producer) => setState('positions', producer),
    setOrders: (producer) => setState('orders', producer),
  };

  onMount(() => {
    console.log("[AppContext] onMount: Initializing authentication and BrokerAPI.");
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    let user = null;
    let finalBrokerApi: BrokerAPI;

    if (token && userStr) {
      try {
        user = JSON.parse(userStr);
        const userSpecificKey = `klinecharts_pro_mock_broker_state_${user.id}`;
        finalBrokerApi = new MockBrokerAPI(userSpecificKey);
      } catch (e) {
        finalBrokerApi = new MockBrokerAPI('default_guest_key');
      }
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
    console.log("[AppContext] onMount: Initialization complete.");
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
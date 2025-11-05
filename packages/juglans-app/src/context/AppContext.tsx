import { createContext, useContext, Component, ParentProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import type { ChartPro, BrokerAPI, SymbolInfo, Period } from '@klinecharts/pro';
import type { ChartProLight } from '@klinecharts/light';
import { MockBrokerAPI } from '../api/MockBrokerAPI';
import type { SuggestionItem } from '../components/chat/SuggestionList';
import type { Editor } from '@tiptap/core';

type AnyChart = ChartPro | ChartProLight;

export interface QuickSuggestion {
  text: string; // The text displayed on the button
  sendText?: string; // Optional: The actual text to be sent. If not provided, 'text' is used.
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
}

export interface AppContextActions {
  setChart: (chart: AnyChart | null) => void;
  setSymbol: (symbol: SymbolInfo) => void;
  setPeriod: (period: Period) => void;
  setChartMode: (mode: 'pro' | 'light') => void;
  setChatExtension: (extension: ChatExtension | null) => void;
  sendMessage: (text: string) => void;
  navigate: ReturnType<typeof useNavigate>;
}

type AppContextValue = [state: AppContextState, actions: AppContextActions];

const AppContext = createContext<AppContextValue>();

export const AppContextProvider: Component<ParentProps> = (props) => {
  const [state, setState] = createStore<AppContextState>({
    chart: null,
    brokerApi: new MockBrokerAPI(),
    symbol: { ticker: 'BTC-USDT' },
    period: { multiplier: 1, timespan: 'hour', text: '1H' },
    chartMode: 'pro',
    chatExtension: null,
  });

  const actions: AppContextActions = {
    setChart(chart: AnyChart | null) {
      setState('chart', chart);
    },
    setSymbol(symbol: SymbolInfo) {
      setState('symbol', symbol);
    },
    setPeriod(period: Period) {
      setState('period', period);
    },
    setChartMode(mode: 'pro' | 'light') {
      setState('chartMode', mode);
    },
    setChatExtension(extension: ChatExtension | null) {
      setState('chatExtension', extension);
    },
    sendMessage: (text: string) => {
      const event = new CustomEvent('send-chat-message', { detail: text });
      document.body.dispatchEvent(event);
    },
    navigate: (() => {}) as ReturnType<typeof useNavigate>
  };

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
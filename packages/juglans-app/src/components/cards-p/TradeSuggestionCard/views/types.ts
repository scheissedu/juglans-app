// packages/juglans-app/src/components/cards-p/TradeSuggestionCard/views/types.ts
import { Store, SetStoreFunction } from 'solid-js/store';
import { AppContextState } from '@/context/AppContext';
import { LocalTradeState } from '../types';

// 定义所有子视图都必须接收的 props 接口
export interface TradeViewProps<T> {
  // data 是从 AI 收到的原始、不可变的建议
  data: T;
  // tradeStore 是父组件中可变的、用于交互的状态
  tradeStore: [Store<LocalTradeState>, SetStoreFunction<LocalTradeState>];
  // 全局 App 状态
  appState: AppContextState;
  // 从父组件传入的预览状态
  isPreviewing: boolean;
}
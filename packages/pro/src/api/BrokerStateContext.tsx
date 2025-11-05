// /klinecharts-workspace/packages/pro/src/api/BrokerStateContext.tsx

import { createContext, useContext, Component, ParentProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { AccountInfo, Position, Order } from '../types';

export interface BrokerState {
  accountInfo: AccountInfo | null;
  positions: Position[];
  orders: Order[];
}

// The context will hold the state and its setter
const BrokerStateContext = createContext<[BrokerState, (newState: Partial<BrokerState>) => void]>();

export const BrokerStateProvider: Component<ParentProps> = (props) => {
  const [state, setState] = createStore<BrokerState>({
    accountInfo: null,
    positions: [],
    orders: [],
  });

  const value: [BrokerState, (newState: Partial<BrokerState>) => void] = [state, (newState) => setState(newState)];

  return (
    <BrokerStateContext.Provider value={value}>
      {props.children}
    </BrokerStateContext.Provider>
  );
};

export function useBrokerState() {
  const context = useContext(BrokerStateContext);
  if (!context) {
    throw new Error('useBrokerState must be used within a BrokerStateProvider');
  }
  return context;
}
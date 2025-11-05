// /klinecharts-workspace/packages/pro/src/api/BrokerAPIContext.tsx

import { createContext, useContext } from 'solid-js';
import type { BrokerAPI } from '../types';

// The context will hold the BrokerAPI instance, which can be null if not provided.
const BrokerContext = createContext<BrokerAPI | null>(null);

// Custom hook for easy access
export function useBroker() {
  return useContext(BrokerContext);
}

export const BrokerProvider = BrokerContext.Provider;
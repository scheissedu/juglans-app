// /klinecharts-workspace/packages/preview/src/ChartProContext.tsx

import { createContext, useContext } from 'solid-js';
import type { ChartPro } from '@klinecharts/pro';
import type { Accessor, Setter } from 'solid-js';

// 定义 Context 中值的类型
export interface ChartProContextState {
  chart: Accessor<ChartPro | null>;
  setChart: Setter<ChartPro | null>;
}

// 创建 Context
const ChartProContext = createContext<ChartProContextState>();

// 创建一个自定义 Hook，方便使用
export function useChartPro() {
  const context = useContext(ChartProContext);
  if (!context) {
    throw new Error('useChartPro must be used within a ChartProProvider');
  }
  return context;
}

export default ChartProContext;
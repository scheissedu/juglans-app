// packages/juglans-app/src/pages/ChartPage.tsx

import { Component, createEffect, on, onMount, onCleanup } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useAppContext } from '../context/AppContext';
import ChartContainer from '../components/ChartContainer';
import { createChartChatExtension } from '../components/chat/extensions/chart';
import { useEditor } from '../context/EditorContext';

const ChartPage: Component = () => {
  console.log('[ChartPage.tsx] Component rendering...');

  const [state, actions] = useAppContext();
  const { editor } = useEditor();
  const params = useParams();

  // --- 核心修正：移除 handleRobotSelection 函数和相关的事件监听 ---
  onMount(() => {
    console.log('[ChartPage.tsx] onMount: Registering chart chat extension.');
    const extension = createChartChatExtension([state, actions], editor);
    actions.setChatExtension(extension);
  });
  
  onCleanup(() => {
    console.log('[ChartPage.tsx] onCleanup: Unregistering chart chat extension.');
    if (state.chatExtension && state.chatExtension.getCommands().some(c => c.key === 'add_klines')) {
        actions.setChatExtension(null);
    }
  });
  // --- 修正结束 ---

  createEffect(on(() => params.symbol, (ticker) => {
    if (ticker && ticker !== state.symbol.ticker) {
      console.log(`[ChartPage.tsx] Route param changed, updating symbol to: ${ticker}`);
      actions.setSymbol({ ticker });
    }
  }));

  return (
    <>
      {console.log('[ChartPage.tsx] Rendering ChartContainer...')}
      <ChartContainer 
        mode={state.chartMode}
        onChartReady={actions.setChart}
      />
    </>
  );
};

export default ChartPage;
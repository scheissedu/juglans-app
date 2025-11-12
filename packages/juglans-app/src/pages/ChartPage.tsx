// packages/juglans-app/src/pages/ChartPage.tsx
import { Component, createEffect, on, onMount, onCleanup, Show, createMemo, createResource } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useAppContext, ContextSource } from '../context/AppContext';
import { Instrument } from '@/instruments';
import ChartContainer from '../components/ChartContainer';
import { createChartChatExtension } from '../components/chat/extensions/chart';
import { useEditor } from '@/context/EditorContext';
import { Loading } from '@klinecharts/pro';

const ChartPage: Component = () => {
  console.log('[ChartPage.tsx] Component rendering...');

  const [state, actions] = useAppContext();
  const { editor } = useEditor();
  const params = useParams();

  const instrumentIdentifier = createMemo(() => {
    // 优先使用 URL 参数
    if (params.symbol) {
      try {
        return decodeURIComponent(params.symbol);
      } catch (e) {
        console.error("Failed to decode URL param:", e);
        return state.instrument.identifier; // 解码失败则回退
      }
    }
    // 如果没有 URL 参数，使用 context 中的默认值
    return state.instrument.identifier;
  });

  const [instrumentResource] = createResource(instrumentIdentifier, async (identifier) => {
    console.log(`[ChartPage.tsx] Resource fetcher for: ${identifier}`);
    // 创建 Instrument 是同步的，我们直接返回它
    return new Instrument(identifier);
  });
  
  createEffect(() => {
    const instrument = instrumentResource();
    // 当 resource 加载成功后，同步到全局状态，以便其他组件（如 AI 上下文）能获取到
    if (instrument && state.instrument && instrument.identifier !== state.instrument.identifier) {
      console.log(`[ChartPage.tsx] Syncing new instrument to AppContext: ${instrument.identifier}`);
      actions.setInstrument(instrument);
    }
  });

  onMount(() => {
    console.log('[ChartPage.tsx] onMount: Registering chat extension.');
    const extension = createChartChatExtension([state, actions], editor);
    actions.setChatExtension(extension);

    const marketContextSource: ContextSource = {
      id: 'market_context',
      label: 'Market Context (Current Chart)',
      getContext: async () => extension.getContext(),
    };
    actions.registerContextSource(marketContextSource);
  });
  
  onCleanup(() => {
    console.log('[ChartPage.tsx] onCleanup: Unregistering chat extension.');
    if (state.chatExtension) actions.setChatExtension(null);
    actions.unregisterContextSource('market_context');
  });

  return (
    <Show when={!instrumentResource.loading && instrumentResource()} fallback={<Loading />}>
      {(instrument) => (
        <ChartContainer 
          mode={state.chartMode}
          onChartReady={actions.setChart}
          instrument={instrument()} 
        />
      )}
    </Show>
  );
};

export default ChartPage;
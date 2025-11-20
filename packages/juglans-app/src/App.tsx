// packages/juglans-app/src/App.tsx
import { Component, createEffect, on, onCleanup, ParentProps, createSignal, Show } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import { produce } from 'solid-js/store';
import { KLineChartPro } from '@klinecharts/pro';
import { useAppContext } from './context/AppContext';
import Navbar from './components/Navbar/Navbar';
import { ChatArea } from './components/chat/ChatArea';
import ModeSelectorModal from './components/modals/ModeSelectorModal';
import Sidebar from './components/Sidebar/Sidebar';
import { startOnboarding, hasCompletedOnboarding } from './services/onboarding.service';

const responsiveStyles = `
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--dark-bg);
  }
  .main-content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .app-layout-wide .main-content-area {
    flex-direction: row !important;
  }
  /* Style for expanded chat on mobile */
  .chat-area-wrapper-expanded {
    position: fixed !important;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    margin: 0 !important;
    max-height: none !important;
    border-radius: 0 !important;
    border-left: none !important;
    padding: 0 !important;
  }
`;

const App: Component<ParentProps> = (props) => {
  const [state, actions] = useAppContext();
  const [isModeSelectorOpen, setModeSelectorOpen] = createSignal(false);
  const [isSidebarOpen, setSidebarOpen] = createSignal(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isWideLayout, setIsWideLayout] = createSignal(window.innerWidth > 1000);
  
  // State to manage if the chat area is expanded on mobile
  const [isChatExpanded, setIsChatExpanded] = createSignal(false);

  let chartWrapperRef: HTMLDivElement | undefined;

  // In-component onboarding logic
  createEffect(() => {
    if (!state.authLoading && props.children) {
      setTimeout(() => {
        if (!hasCompletedOnboarding()) {
          startOnboarding();
        }
      }, 1000);
    }
  });

  createEffect(() => {
    const brokerApi = state.brokerApi;
    if (brokerApi) {
      brokerApi.subscribe({
        onAccountInfoUpdate: (accountInfo) => actions.setAccountInfo(accountInfo),
        onPositionUpdate: (position) => {
          actions.setPositions(produce(positions => {
            const index = positions.findIndex(p => p.id === position.id);
            if (index > -1) {
              if (position.qty <= 0) positions.splice(index, 1);
              else positions[index] = position;
            } else if (position.qty > 0) {
              positions.unshift(position);
            }
          }));
        },
        onOrderUpdate: (order) => {
          actions.setOrders(produce(orders => {
            const index = orders.findIndex(o => o.id === order.id);
            if (index > -1) orders[index] = order;
            else orders.unshift(order);
          }));
        },
        onExecution: (execution) => {}
      });
    }
    onCleanup(() => brokerApi?.unsubscribe());
  });

  createEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1001px)');
    const handleResize = () => {
      const isNowWide = mediaQuery.matches;
      setIsWideLayout(isNowWide);
      // If screen becomes wide, force-close the expanded chat view
      if (isNowWide) {
        setIsChatExpanded(false);
      }
      setTimeout(() => state.chart?.getChart()?.resize(), 100);
    };
    handleResize();
    mediaQuery.addEventListener('change', handleResize);
    
    if (actions) {
      (actions as any).navigate = navigate;
    }
    
    onCleanup(() => mediaQuery.removeEventListener('change', handleResize));
  });

  createEffect(() => {
    if (!chartWrapperRef) return;
    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => state.chart?.getChart()?.resize(), 100);
    };
    const observer = new ResizeObserver(debouncedResize);
    observer.observe(chartWrapperRef);
    onCleanup(() => {
      clearTimeout(resizeTimeout);
      observer.disconnect();
    });
  });

  createEffect(() => {
    location.pathname;
    setTimeout(() => state.chart?.getChart()?.resize(), 100);
  });
  
  createEffect(on(() => state.chartMode, (mode) => {
    let theme = 'dark';
    if (mode === 'pro' && state.chart instanceof KLineChartPro) {
      theme = state.chart.getTheme() ?? 'dark';
    }
    document.body.setAttribute('data-theme', theme);
  }));

  onCleanup(() => document.body.removeAttribute('data-theme'));

  const chatWrapperStyle = () => (isWideLayout()
    ? { width: '350px', 'flex-shrink': '0', height: '100%', display: 'flex', 'flex-direction': 'column', 'border-left': '1px solid var(--border-color)' }
    : { 
        'flex-shrink': '0', 
        display: 'flex', 
        'flex-direction': 'column', 
        'border-radius': '8px', 
        'overflow': 'hidden',
        // --- 核心修复: 更新 margin 值为 '0 2px 2px' ---
        'margin': '0 2px 2px',
      }
  );

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={{ position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', 'overflow': 'hidden' }}>
        <div class="global-glow-border" />
        <div class="app-layout" classList={{ 'app-layout-wide': isWideLayout() }}>
          <Navbar onGridClick={() => setSidebarOpen(true)} onModeSelectorClick={() => setModeSelectorOpen(true)} />
          <div class="main-content-area">
            <div class="chart-page-wrapper" ref={chartWrapperRef} style={{ flex: '1', 'min-height': '0', position: 'relative', 'overflow-y': 'auto' }}>
              <Show when={props.children} fallback={<div>Loading Page...</div>}>
                {props.children}
              </Show>
            </div>
            
            <div 
              class="chat-area-wrapper" 
              style={chatWrapperStyle()}
              classList={{ 'chat-area-wrapper-expanded': isChatExpanded() && !isWideLayout() }}
            >
              <ChatArea 
                isExpanded={isChatExpanded()}
                onToggle={setIsChatExpanded}
                isWide={isWideLayout()}
              /> 
            </div>
          </div>
        </div>
        <Sidebar isOpen={isSidebarOpen()} onClose={() => setSidebarOpen(false)} />
        <ModeSelectorModal isOpen={isModeSelectorOpen} onClose={() => setModeSelectorOpen(false)} />
      </div>
    </>
  );
};

export default App;
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
import { startOnboarding, hasCompletedOnboarding } from './services/onboarding.service'; // 导入教程服务

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
    padding: 0 12px 12px;
    box-sizing: border-box;
  }
  .app-layout-wide .main-content-area {
    flex-direction: row !important;
    padding: 0;
  }
`;

const App: Component<ParentProps> = (props) => {
  const [state, actions] = useAppContext();
  const [isModeSelectorOpen, setModeSelectorOpen] = createSignal(false);
  const [isSidebarOpen, setSidebarOpen] = createSignal(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isWideLayout, setIsWideLayout] = createSignal(window.innerWidth > 1000);

  let chartWrapperRef: HTMLDivElement | undefined;

  // 在组件挂载后延迟触发教程
  createEffect(() => {
    // 确保在主内容渲染后，并且 AppContext 加载完毕后执行
    if (!state.authLoading && props.children) {
      setTimeout(() => {
        if (!hasCompletedOnboarding()) {
          startOnboarding();
        }
      }, 1000); // 延迟1秒，确保所有 DOM 元素都已渲染
    }
  });

  createEffect(() => {
    const brokerApi = state.brokerApi;
    if (brokerApi) {
      console.log('[App.tsx] Subscribing to BrokerAPI updates...');
      brokerApi.subscribe({
        onAccountInfoUpdate: (accountInfo) => {
          console.log('[App.tsx] Received onAccountInfoUpdate in subscription callback:', accountInfo);
          actions.setAccountInfo(accountInfo);
        },
        onPositionUpdate: (position) => {
          actions.setPositions(produce(positions => {
            const index = positions.findIndex(p => p.id === position.id);
            if (index > -1) {
              if (position.qty <= 0) {
                positions.splice(index, 1);
              } else {
                positions[index] = position;
              }
            } else if (position.qty > 0) {
              positions.unshift(position);
            }
          }));
        },
        onOrderUpdate: (order) => {
          actions.setOrders(produce(orders => {
            const index = orders.findIndex(o => o.id === order.id);
            if (index > -1) {
              orders[index] = order;
            } else {
              orders.unshift(order);
            }
          }));
        },
        onExecution: (execution) => {}
      });
    }

    onCleanup(() => {
      if (brokerApi) {
        console.log('[App.tsx] Unsubscribing from BrokerAPI updates.');
        brokerApi.unsubscribe();
      }
    });
  });

  createEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1001px)');
    const handleResize = () => {
      setIsWideLayout(mediaQuery.matches);
      setTimeout(() => state.chart?.getChart()?.resize(), 100);
    };
    handleResize();
    mediaQuery.addEventListener('change', handleResize);
    
    if (actions) {
      (actions as any).navigate = navigate;
    }
    
    onCleanup(() => {
      mediaQuery.removeEventListener('change', handleResize);
    });
  });

  createEffect(() => {
    if (!chartWrapperRef) return;

    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        state.chart?.getChart()?.resize();
      }, 100);
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

  onCleanup(() => {
    document.body.removeAttribute('data-theme');
  });

  const chartWrapperStyle = () => (isWideLayout()
    ? { flex: '1', 'min-width': '0', height: '100%', position: 'relative' }
    : { flex: '1', 'min-height': '0', position: 'relative' }
  );

  const chatWrapperStyle = () => (isWideLayout()
    ? { width: '350px', 'flex-shrink': '0', height: '100%', display: 'flex', 'flex-direction': 'column', 'border-left': '1px solid var(--border-color)' }
    : { 
        'max-height': 'min(400px, 50%)',
        'flex-shrink': '0', 
        'margin-top': '12px', 
        display: 'flex', 
        'flex-direction': 'column', 
        'border-radius': '8px', 
        'overflow': 'hidden', 
      }
  );

  return (
    <>
      <style>{responsiveStyles}</style>
      <div 
        style={{ 
          position: 'fixed', 
          top: '0', 
          left: '0', 
          right: '0', 
          bottom: '0',
          'overflow': 'hidden' 
        }}
      >
        <div class="global-glow-border" />
        <div class="app-layout" classList={{ 'app-layout-wide': isWideLayout() }}>
          <Navbar onGridClick={() => setSidebarOpen(true)} onModeSelectorClick={() => setModeSelectorOpen(true)} />
          <div class="main-content-area">
            <div class="chart-page-wrapper" ref={chartWrapperRef} style={chartWrapperStyle()}>
              <Show when={props.children} fallback={<div>Loading Page...</div>}>
                {props.children}
              </Show>
            </div>
            
            <div class="chat-area-wrapper" style={chatWrapperStyle()}>
              <ChatArea /> 
            </div>
          </div>
        </div>
        <Sidebar isOpen={isSidebarOpen()} onClose={() => setSidebarOpen(false)} />
        <ModeSelectorModal 
          isOpen={isModeSelectorOpen} 
          onClose={() => setModeSelectorOpen(false)} 
        />
      </div>
    </>
  );
};

export default App;
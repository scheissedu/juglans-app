import { Component, createEffect, on, onMount, onCleanup, ParentProps, createSignal, Show } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import { produce } from 'solid-js/store';

import { KLineChartPro } from '@klinecharts/pro';
import { useAppContext } from './context/AppContext';
import { useBrokerState } from '@klinecharts/pro';
import Navbar from './components/Navbar/Navbar';
import { ChatArea } from './components/chat/ChatArea';
import ModeSelectorModal from './components/modals/ModeSelectorModal';

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
  const [, setBrokerState] = useBrokerState();
  const [isModeSelectorOpen, setModeSelectorOpen] = createSignal(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isWideLayout, setIsWideLayout] = createSignal(window.innerWidth > 1000);

  onMount(() => {
    const brokerApi = state.brokerApi;
    if (brokerApi) {
      console.log('[App.tsx] Subscribing to BrokerAPI updates...');
      brokerApi.subscribe({
        onAccountInfoUpdate: (accountInfo) => {
          setBrokerState('accountInfo', accountInfo);
        },
        onPositionUpdate: (position) => {
          setBrokerState('positions', produce(positions => {
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
          setBrokerState('orders', produce(orders => {
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
    : { height: '400px', position: 'relative', 'flex-shrink': '0' }
  );

  const chatWrapperStyle = () => (isWideLayout()
    ? { width: '350px', 'flex-shrink': '0', height: '100%', display: 'flex', 'flex-direction': 'column', 'border-left': '1px solid var(--border-color)' }
    : { flex: '1', 'min-height': '0', 'margin-top': '12px', display: 'flex', 'flex-direction': 'column', 'border-radius': '8px', 'overflow': 'hidden', 'border': '1px solid var(--border-color)' }
  );

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <div class="global-glow-border" />
        <div class="app-layout" classList={{ 'app-layout-wide': isWideLayout() }}>
          <Navbar onModeSelectorClick={() => setModeSelectorOpen(true)} />
          
          <div class="main-content-area">
            <div class="chart-page-wrapper" style={chartWrapperStyle()}>
              <Show when={props.children} fallback={<div>Loading Page...</div>}>
                {props.children}
              </Show>
            </div>
            
            <div class="chat-area-wrapper" style={chatWrapperStyle()}>
              <ChatArea /> 
            </div>
          </div>
        </div>
        <ModeSelectorModal 
          isOpen={isModeSelectorOpen} 
          onClose={() => setModeSelectorOpen(false)} 
        />
      </div>
    </>
  );
};

export default App;
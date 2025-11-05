// packages/juglans-app/src/main.tsx (修正后)
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { AppContextProvider } from './context/AppContext';
// --- 核心修正：从主入口导入 ---
import { BrokerStateProvider } from '@klinecharts/pro';
import { ChatAreaProvider } from './components/chat/ChatArea';

import App from './App';
import ChartPage from './pages/ChartPage';
import WalletPage from './pages/WalletPage';
import MarketPage from './pages/MarketPage';

import '@klinecharts/pro/index.less';

import './index.css';

render(() => (
  <AppContextProvider>
    <BrokerStateProvider>
      <ChatAreaProvider>
        <Router>
          <Route path="/" component={App}>
            <Route path="/" component={ChartPage} />
            <Route path="/wallet" component={WalletPage} />
            <Route path="/market" component={MarketPage} />
            <Route path="/market/:symbol" component={ChartPage} />
          </Route>
        </Router>
      </ChatAreaProvider>
    </BrokerStateProvider>
  </AppContextProvider>
), document.getElementById('root') as HTMLElement);
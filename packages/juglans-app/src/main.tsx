// packages/juglans-app/src/main.tsx
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { AppContextProvider } from './context/AppContext';
import { BrokerStateProvider } from '@klinecharts/pro';
import { ChatAreaProvider } from './components/chat/ChatArea';

import App from './App';
import ChartPage from './pages/ChartPage';
import WalletPage from './pages/WalletPage';
import MarketPage from './pages/MarketPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JoinPage from './pages/JoinPage'; // --- 核心修改 1: 导入新页面 ---
import ProfilePage from './pages/ProfilePage';

import '@klinecharts/pro/index.less';
import './index.css';

render(() => (
  <AppContextProvider>
    <BrokerStateProvider>
      <ChatAreaProvider>
        <Router>
          {/* Public routes rendered outside the main App layout/guard */}
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/join" component={JoinPage} /> {/* --- 核心修改 2: 添加 /join 路由 --- */}

          {/* Main application routes, protected by the App component */}
          <Route path="/*" component={App}>
            <Route path="/" component={ChartPage} />
            <Route path="/wallet" component={WalletPage} />
            <Route path="/market" component={MarketPage} />
            <Route path="/market/:symbol" component={ChartPage} />
            <Route path="/profile" component={ProfilePage} />
          </Route>
        </Router>
      </ChatAreaProvider>
    </BrokerStateProvider>
  </AppContextProvider>
), document.getElementById('root') as HTMLElement);
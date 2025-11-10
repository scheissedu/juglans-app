// packages/juglans-app/src/main.tsx
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { Show, Component } from 'solid-js';
import { AppContextProvider, useAppContext } from './context/AppContext';
import { Loading } from '@klinecharts/pro';
import { ChatAreaProvider } from './components/chat/ChatArea';

import App from './App';
import ChartPage from './pages/ChartPage';
import WalletPage from './pages/WalletPage';
import MarketPage from './pages/MarketPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JoinPage from './pages/JoinPage';
import ProfilePage from './pages/ProfilePage';
import WaitlistPage from './pages/WaitlistPage';
import NewsPage from './pages/NewsPage';

import '@klinecharts/pro/index.less';
import './index.css';

const Root: Component = () => {
  const [state] = useAppContext();

  return (
    <Show when={!state.authLoading} fallback={<Loading />}>
      <Router>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/join" component={JoinPage} />
        <Route path="/waitlist" component={WaitlistPage} />

        <Route path="/" component={App}>
          <Route path="/" component={ChartPage} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/market" component={MarketPage} />
          <Route path="/market/:symbol" component={ChartPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/news" component={NewsPage} />
        </Route>
      </Router>
    </Show>
  );
};

render(() => (
  <AppContextProvider>
    <ChatAreaProvider>
      <Root />
    </ChatAreaProvider>
  </AppContextProvider>
), document.getElementById('root') as HTMLElement);
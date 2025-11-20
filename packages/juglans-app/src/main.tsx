// packages/juglans-app/src/main.tsx
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { Show, Component } from 'solid-js';
import { AppContextProvider, useAppContext } from './context/AppContext';
import { Loading } from '@klinecharts/pro';
import { ChatAreaProvider } from './components/chat/ChatArea';

import App from './App';
import ChartPage from './pages/ChartPage';
import WalletPage from './pages/WalletPage'; // 文件名暂不改，逻辑内部改为 Portfolio
import MarketPage from './pages/MarketPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JoinPage from './pages/JoinPage';
import ProfilePage from './pages/ProfilePage';
import WaitlistPage from './pages/WaitlistPage';
import NewsPage from './pages/NewsPage';
import LiveChatPage from './pages/LiveChatPage';
import TutorialsPage from './pages/TutorialsPage';
import PredictMarketPage from './pages/PredictMarketPage';
import CourseDetailPage from './pages/tutorials/CourseDetailPage'; 
import ArticlePage from './pages/ArticlePage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import PublicProfilePage from './pages/PublicProfilePage';

import '@klinecharts/pro/index.less';
import './index.css';

const Root: Component = () => {
  const [state] = useAppContext();

  return (
    <Show when={!state.authLoading} fallback={<Loading />}>
      <Router>
        {/* Standalone pages */}
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/join" component={JoinPage} />
        <Route path="/auth/callback" component={AuthCallbackPage} />
        <Route path="/waitlist" component={WaitlistPage} />

        {/* Pages that use the main App layout */}
        <Route path="/" component={App}>
          <Route path="/" component={ChartPage} />
          {/* --- 核心修改: 路由改为 /portfolio --- */}
          <Route path="/portfolio" component={WalletPage} />
          <Route path="/market" component={MarketPage} />
          <Route path="/market/:symbol" component={ChartPage} />
          <Route path="/predict-market/:slug" component={PredictMarketPage} /> 
          <Route path="/profile" component={ProfilePage} />
          <Route path="/u/:username" component={PublicProfilePage} />
          
          <Route path="/news" component={NewsPage} />
          <Route path="/live-chat/:channelId" component={LiveChatPage} />
          <Route path="/tutorials" component={TutorialsPage} />
          <Route path="/tutorials/courses/:slug" component={CourseDetailPage} />
          <Route path="/articles/:slug" component={ArticlePage} />
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
// packages/juglans-app/src/pages/NewsPage.tsx
import { Component, createSignal, Show, createResource } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { fetchNews, fetchNewsBySymbol } from '@/api/newsApi';
import { useAppContext } from '@/context/AppContext';
import NewsFilter from './news/NewsFilter';
import NewsList from './news/NewsList';
import './NewsPage.css';

const sources = ['coindesk', 'cointelegraph', 'decrypt', 'theblock'];

const NewsPage: Component = () => {
  const [state] = useAppContext();
  const [searchParams] = useSearchParams();
  const symbolFromUrl = () => searchParams.symbol;

  const [selectedSource, setSelectedSource] = createSignal('coindesk');
  
  const [newsData] = createResource(
    () => ({ 
      source: selectedSource(), 
      token: state.token, 
      symbol: symbolFromUrl() 
    }), 
    async ({ source, token, symbol }) => {
      if (token) {
        if (symbol) {
          const symbolBase = symbol.split('-')[0]; // eg. BTC-USDT -> BTC
          return fetchNewsBySymbol(symbolBase, token);
        }
        return fetchNews(source, token);
      }
      return [];
    }
  );

  return (
    <div class="news-page-container">
      <header class="news-page-header">
        <h1>{symbolFromUrl() ? `News for ${symbolFromUrl()}` : 'Latest News'}</h1>
        <Show when={!symbolFromUrl()}>
          <NewsFilter 
            categories={sources}
            activeCategory={selectedSource()}
            onSelectCategory={setSelectedSource}
          />
        </Show>
      </header>
      <main class="news-content-area">
        <NewsList 
          articles={newsData()} 
          loading={newsData.loading}
        />
      </main>
    </div>
  );
};

export default NewsPage;
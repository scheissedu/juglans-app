// packages/juglans-app/src/pages/MarketPage.tsx
import { Component, createSignal, onMount, onCleanup, createMemo } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { SymbolInfo } from '@klinecharts/pro';
import UnifiedDatafeed from '../api/datafeed/UnifiedDatafeed';
import { createStore } from 'solid-js/store';
import './MarketPage.css';
import AssetList from './market/AssetList';
import DiscoverTags from './market/DiscoverTags';
import type { DiscoverTag } from './market/DiscoverTags';
import { TickerData } from '../../types';

const datafeed = new UnifiedDatafeed();
const POLLING_INTERVAL = 5000;

const marketTags: DiscoverTag[] = [
  { label: 'Crypto', searchTerm: 'crypto' },
  { label: 'Stocks', searchTerm: 'stocks' },
];

const MarketPage: Component = () => {
  const navigate = useNavigate();
  
  const [activeTag, setActiveTag] = createSignal<MarketTag>('crypto');
  
  const [cryptoSymbols, setCryptoSymbols] = createSignal<SymbolInfo[]>([]);
  const [stockSymbols, setStockSymbols] = createSignal<SymbolInfo[]>([]);
  
  const [loading, setLoading] = createSignal(true);
  
  const [tickers, setTickers] = createStore<Record<string, TickerData>>({});

  let pollingIntervalId: number;

  const activeSymbols = createMemo(() => {
    return activeTag() === 'crypto' ? cryptoSymbols() : stockSymbols();
  });

  const fetchCryptoTickers = async () => {
    if (activeTag() === 'crypto') {
      try {
        const tickerList = await datafeed.getOkxTickers();
        const tickersMap: Record<string, TickerData> = {};
        for (const ticker of tickerList) {
            tickersMap[ticker.symbol] = ticker;
        }
        setTickers(tickersMap);
      } catch (error) {
        console.error("Failed to fetch tickers:", error);
      }
    }
  };

  onMount(() => {
    setLoading(true);
    
    // 同时请求加密货币和股票的初始数据
    Promise.all([
      new Promise<SymbolInfo[]>((resolve) => {
        datafeed.searchSymbols('USDT', 'crypto', (symbols) => {
          const topCryptos = symbols
            .filter(s => s.exchange === 'OKX' && s.market === 'spot')
            .slice(0, 100); // 加载 100 个作为初始列表
          resolve(topCryptos);
        });
      }),
      new Promise<SymbolInfo[]>((resolve) => {
        datafeed.searchSymbols('a', 'stocks', (symbols) => {
          const topStocks = ['AAPL', 'GOOG', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'META'];
          const filtered = symbols.filter(s => topStocks.includes(s.ticker));
          resolve(filtered);
        });
      })
    ]).then(([cryptos, stocks]) => {
      setCryptoSymbols(cryptos);
      setStockSymbols(stocks);
      
      fetchCryptoTickers().finally(() => {
        setLoading(false);
      });

      pollingIntervalId = setInterval(fetchCryptoTickers, POLLING_INTERVAL);
    });
  });

  onCleanup(() => {
    clearInterval(pollingIntervalId);
  });

  const handleItemClick = (symbol: SymbolInfo) => {
    if (symbol.ticker) {
      navigate(`/market/${symbol.ticker}`);
    }
  };

  return (
    <div class="market-page-container">
      <DiscoverTags 
        tags={marketTags} 
        activeTag={activeTag()}
        onTagClick={(tag) => setActiveTag(tag as MarketTag)}
      />
      <div class="asset-list-divider" />
      <AssetList
        symbols={activeSymbols()}
        tickers={activeTag() === 'crypto' ? tickers : {}}
        loading={loading()}
        onItemClick={handleItemClick}
      />
    </div>
  );
};

export default MarketPage;
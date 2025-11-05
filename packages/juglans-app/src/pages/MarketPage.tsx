import { Component, createSignal, onMount, onCleanup } from 'solid-js';
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
const POLLING_INTERVAL = 3000;

const discoverTags: DiscoverTag[] = [
  { icon: '🚀', label: 'Altcoins', searchTerm: 'coin' },
  { icon: '📈', label: 'Top Movers', searchTerm: 'BTC' },
  { icon: '💎', label: 'DeFi', searchTerm: 'UNI' },
  { icon: '🎮', label: 'Gaming', searchTerm: 'SAND' },
  { icon: '🖼️', label: 'NFTs', searchTerm: 'APE' },
  { icon: '💡', label: 'Tech Stocks', searchTerm: 'AAPL' },
  { icon: '⚡️', label: 'Energy', searchTerm: 'TSLA' },
];

const MarketPage: Component = () => {
  const navigate = useNavigate();
  const [symbols, setSymbols] = createSignal<SymbolInfo[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [tickers, setTickers] = createStore<Record<string, TickerData>>({});

  let pollingIntervalId: number;

  const fetchTickers = async () => {
    const tickerList = await datafeed.getOkxTickers();
    const tickersMap: Record<string, TickerData> = {};
    for (const ticker of tickerList) {
        tickersMap[ticker.symbol] = ticker;
    }
    setTickers(tickersMap);
  };

  onMount(() => {
    setLoading(true);
    new Promise<SymbolInfo[]>((resolve) => {
      datafeed.searchSymbols('USDT', (result) => resolve(result));
    }).then(allSymbols => {
      const okxSpotSymbols = allSymbols
        .filter(s => s.exchange === 'OKX' && s.market === 'spot' && s.ticker.endsWith('-USDT'))
        .slice(0, 100);
      
      setSymbols(okxSpotSymbols);
      
      fetchTickers().finally(() => {
        setLoading(false);
      });

      pollingIntervalId = setInterval(fetchTickers, POLLING_INTERVAL);
    });
  });

  onCleanup(() => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }
  });

  const handleItemClick = (symbol: SymbolInfo) => {
    if (symbol.ticker) {
      navigate(`/market/${symbol.ticker}`);
    }
  };

  const handleTagClick = (term: string) => {
    console.log("Tag clicked, search term:", term);
    // Future filtering logic can be implemented here
  };

  return (
    <div class="market-page-container">
      <DiscoverTags 
        tags={discoverTags} 
        onTagClick={handleTagClick}
      />
      
      <div class="asset-list-divider" />

      <AssetList
        symbols={symbols()}
        tickers={tickers}
        loading={loading()}
        onItemClick={handleItemClick}
      />
    </div>
  );
};

export default MarketPage;
// packages/juglans-app/src/pages/MarketPage.tsx
import { Component, createSignal, onMount, onCleanup, createMemo, Accessor, createEffect, on, Show, For, batch } from 'solid-js';
import { useNavigate, useSearchParams } from '@solidjs/router';
import { createStore, produce } from 'solid-js/store';

import UnifiedDatafeed from '@/api/datafeed/UnifiedDatafeed';
import PredictDatafeed from '@/api/datafeed/PredictDatafeed';

import { useAppContext } from '@/context/AppContext';
import { useEditor } from '@/context/EditorContext';
import { createMarketChatExtension } from '@/components/chat/extensions/market';
import { Instrument } from '@/instruments';

import './MarketPage.css';

import AssetList from './market/AssetList';
import OptionsChain from './market/options/OptionsChain'; 
import PredictMarketList from './market/predict/PredictMarketList';
import DiscoverTags, { DiscoverTag } from './market/DiscoverTags';
import { TickerData } from '../../types';

import OptionsIcon from '@/components/icons/OptionsIcon'; 
import CoinIcon from '@/components/icons/CoinIcon';
import TrendingUpIcon from '@/components/icons/TrendingUpIcon';
import CrystalBallIcon from '@/components/icons/CrystalBallIcon';
import StarIcon from '@/components/icons/StarIcon';
import SparklesIcon from '@/components/icons/SparklesIcon';
import LightningIcon from '@/components/icons/LightningIcon';
import RobotIcon from '@/components/icons/RobotIcon';
import LinkIcon from '@/components/icons/LinkIcon';
import GamepadIcon from '@/components/icons/GamepadIcon';
import AlienIcon from '@/components/icons/AlienIcon';
import BookIcon from '@/components/icons/BookIcon';
import UserIcon from '@/components/icons/UserIcon';
import ExchangeIcon from '@/components/icons/ExchangeIcon';

const cryptoAndStockDatafeed = new UnifiedDatafeed();
const predictDatafeed = new PredictDatafeed();
const POLLING_INTERVAL = 5000;

type Category = 'crypto' | 'stocks' | 'predict';

const L1_TAGS: DiscoverTag[] = [
  { label: 'Crypto', searchTerm: 'crypto', icon: CoinIcon },
  { label: 'Stocks', searchTerm: 'stocks', icon: TrendingUpIcon },
  { label: 'Predict', searchTerm: 'predict', icon: CrystalBallIcon },
];

const L2_TAGS: Record<Category, DiscoverTag[]> = {
  crypto: [
    { label: 'All', searchTerm: 'all', icon: BookIcon },
    { label: 'Favorites', searchTerm: 'favorites', icon: StarIcon },
    { label: 'Options', searchTerm: 'options', icon: OptionsIcon },
    { label: 'Altcoins', searchTerm: 'altcoins', icon: AlienIcon },
    { label: 'Newly Listed', searchTerm: 'newly-listed', icon: SparklesIcon },
    { label: 'DeFi', searchTerm: 'defi', icon: LinkIcon },
    { label: 'Gaming', searchTerm: 'gaming', icon: GamepadIcon },
  ],
  stocks: [
    { label: 'All', searchTerm: 'all', icon: BookIcon },
    { label: 'Favorites', searchTerm: 'favorites', icon: StarIcon },
    { label: 'Technology', searchTerm: 'tech', icon: RobotIcon },
    { label: 'Daily Movers', searchTerm: 'movers', icon: LightningIcon },
  ],
  predict: [
    { label: 'All', searchTerm: 'all', icon: BookIcon },
    { label: 'Favorites', searchTerm: 'favorites', icon: StarIcon },
    { label: 'Politics', searchTerm: 'politics', icon: UserIcon },
    { label: 'Economics', searchTerm: 'economics', icon: ExchangeIcon },
  ],
};

// --- 辅助函数：判断是否为股票 ---
// 我们的系统中，加密货币 Ticker 通常包含 '-USDT' 或 '-'
// 股票通常是纯字母 (AAPL) 或 数字+后缀 (0700.HK, 600519.SS)
const isStockTicker = (ticker: string) => {
  return !ticker.includes('-USDT') && !ticker.includes('-SWAP');
};

const MarketPage: Component = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, actions] = useAppContext();
  const { editor } = useEditor();
  
  const activeCategory = createMemo<Category>(() => (searchParams.category as Category) || 'crypto');
  const activeFilter = createMemo(() => searchParams.filter || 'all'); // 默认改为 all，逻辑更清晰

  const handleCategoryClick = (category: string) => {
    // 切换大类时，重置为 'all'
    setSearchParams({ category, filter: 'all' });
  };
  const handleFilterClick = (filter: string) => {
    setSearchParams({ category: activeCategory(), filter });
  };

  const [cryptoInstruments, setCryptoInstruments] = createSignal<Instrument[]>([]);
  const [stockInstruments, setStockInstruments] = createSignal<Instrument[]>([]);
  const [predictionEvents, setPredictionEvents] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [tickers, setTickers] = createStore<Record<string, TickerData>>({});
  
  // --- Crypto 数据获取 ---
  // Crypto API 通常是一个端点返回所有 tickers，所以这里依然获取全量，但在 filter 时做处理
  // 如果 API 支持 filter 参数，也可以在这里优化
  const fetchCryptoData = async () => {
    try {
      const tickerDataArray = await cryptoAndStockDatafeed.getOkxTickers();
      const tickerMap = tickerDataArray.reduce((acc, ticker) => {
        acc[ticker.symbol] = ticker;
        return acc;
      }, {} as Record<string, TickerData>);
      
      setTickers(produce(t => Object.assign(t, tickerMap)));
      
      let instruments = tickerDataArray
        .filter(t => t.symbol.endsWith('-USDT'))
        .map(t => {
            const [base, quote] = t.symbol.split('-');
            const identifier = `CRYPTO:${base}.OKX@${quote}_SPOT`;
            return new Instrument(identifier);
        });

      // 如果是 Favorites，只保留 watchlist 中的
      if (activeFilter() === 'favorites') {
         const watchlistSet = new Set(state.watchlist);
         instruments = instruments.filter(inst => watchlistSet.has(inst.getTicker()));
      }

      setCryptoInstruments(instruments);
    } catch (error) {
      console.error("Failed to fetch crypto data:", error);
    }
  };

  // --- Stock 数据获取 (按需加载核心逻辑) ---
  const fetchStockData = async () => {
    setLoading(true);
    try {
        let instruments: Instrument[] = [];
        const filter = activeFilter();

        if (filter === 'favorites') {
            // 1. 仅加载 Watchlist 中的股票
            const stockTickers = state.watchlist.filter(isStockTicker);
            
            if (stockTickers.length === 0) {
              instruments = [];
            } else {
              // 将 Ticker 转换为 Instrument 对象
              instruments = stockTickers.map(ticker => {
                 if (ticker.endsWith('.HK')) return new Instrument(`HK_STOCK:${ticker}.HKEX@HKD_SPOT`);
                 if (ticker.endsWith('.SS') || ticker.endsWith('.SZ')) return new Instrument(`CN_STOCK:${ticker}.SSE@CNY_SPOT`);
                 return new Instrument(`US_STOCK:${ticker}.NASDAQ@USD_SPOT`);
              });
            }
        } else {
            // 2. 加载默认热门列表 (All, Tech, etc.)
            // 暂时所有非 Favorites 都加载 Popular，未来可以根据 filter 加载不同板块
            instruments = await cryptoAndStockDatafeed.getPopularStockInstruments();
        }

        setStockInstruments(instruments);

        // 3. 批量获取这些股票的行情
        const symbols = instruments.map(i => i.baseSymbol);
        const stockTickers = await cryptoAndStockDatafeed.getStockTickers(symbols);
        
        setTickers(produce(t => Object.assign(t, stockTickers)));

    } catch (error) {
        console.error("Failed to fetch stock data:", error);
    } finally {
        setLoading(false);
    }
  };

  // 用于 UI 显示的列表，现在 instruments 已经在 fetch 阶段被筛选过了
  const activeInstruments = createMemo(() => {
    const category = activeCategory();
    if (category === 'stocks') return stockInstruments();
    return cryptoInstruments();
  });

  const filteredPredictionEvents = createMemo(() => {
    const filter = activeFilter();
    const allEvents = predictionEvents();

    if (filter === 'all' || filter === 'favorites') {
      return allEvents;
    }
    
    return allEvents.filter(event => event.category?.toLowerCase() === filter);
  });
  
  onMount(() => {
    const marketExtension = createMarketChatExtension(
      [state, actions], 
      editor, 
      activeInstruments as Accessor<Instrument[]>
    );
    actions.setChatExtension(marketExtension);

    predictDatafeed.searchEvents('').then(events => {
        setPredictionEvents(events);
    });
  });

  // --- 核心修改：监听 activeCategory 和 activeFilter 的变化 ---
  createEffect(on([activeCategory, activeFilter], ([category, filter]) => {
    let pollingIntervalId: number | undefined;
    
    // 使用 batch 避免 loading 状态闪烁
    batch(() => {
      setLoading(true);
      // 清空当前列表，避免展示旧类别的残余数据
      if (category === 'stocks') setStockInstruments([]);
      if (category === 'crypto') setCryptoInstruments([]);
    });

    if (category === 'crypto') {
      fetchCryptoData().finally(() => setLoading(false));
      pollingIntervalId = setInterval(fetchCryptoData, POLLING_INTERVAL);
    } else if (category === 'stocks') {
      fetchStockData(); // 内部会处理 loading false
    } else {
      setLoading(false); // Predict
    }

    onCleanup(() => { 
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    });
  }));

  onCleanup(() => { 
    if (state.chatExtension) {
      actions.setChatExtension(null);
    }
  });

  const handleItemClick = (instrument: Instrument) => {
    if (instrument.identifier) {
      navigate(`/market/${encodeURIComponent(instrument.identifier)}`);
    }
  };

  return (
    <div class="market-page-container">
      <DiscoverTags 
        tags={L1_TAGS} 
        activeTag={activeCategory()} 
        onTagClick={handleCategoryClick} 
        variant="primary"
      />
      <DiscoverTags 
        title="Explore" 
        tags={L2_TAGS[activeCategory()]} 
        activeTag={activeFilter()} 
        onTagClick={handleFilterClick} 
      />
      
      <div class="asset-list-divider" />
      
      <Show 
        when={activeCategory() === 'predict'} 
        fallback={
          <Show 
            when={activeCategory() === 'crypto' && activeFilter() === 'options'}
            fallback={
                <AssetList 
                    instruments={activeInstruments()} 
                    tickers={tickers} 
                    loading={loading()} 
                    onItemClick={handleItemClick} 
                />
            }
          >
            <OptionsChain underlyingAsset="BTC" />
          </Show>
        }
      >
        <PredictMarketList events={filteredPredictionEvents()} loading={loading()} />
      </Show>
    </div>
  );
};

export default MarketPage;
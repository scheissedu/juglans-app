// packages/juglans-app/src/pages/market/MarketPage.tsx
import { Component, createSignal, onMount, onCleanup, createMemo, Accessor } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import UnifiedDatafeed from '@/api/datafeed/UnifiedDatafeed';
import { createStore } from 'solid-js/store';

import { useAppContext } from '@/context/AppContext';
import { useEditor } from '@/context/EditorContext';
import { createMarketChatExtension } from '@/components/chat/extensions/market';
import { Instrument } from '@/instruments';

import './MarketPage.css';
import './market/DiscoverWidget.css';

import AssetList from './market/AssetList';
import DiscoverTags, { DiscoverTag } from './market/DiscoverTags';
import { TickerData } from '../../types';

import StarIcon from '@/components/icons/StarIcon';
import CoinIcon from '@/components/icons/CoinIcon';
import TrendingUpIcon from '@/components/icons/TrendingUpIcon';
import CrystalBallIcon from '@/components/icons/CrystalBallIcon';
import SparklesIcon from '@/components/icons/SparklesIcon';
import LightningIcon from '@/components/icons/LightningIcon';
import RobotIcon from '@/components/icons/RobotIcon';
import LinkIcon from '@/components/icons/LinkIcon';
import GamepadIcon from '@/components/icons/GamepadIcon';
import AlienIcon from '@/components/icons/AlienIcon';

const datafeed = new UnifiedDatafeed();
const POLLING_INTERVAL = 5000;

type MarketTag = string;

const mainTags: DiscoverTag[] = [
  { label: 'Favorites', searchTerm: 'favorites', icon: StarIcon, iconProps: { isFilled: true } },
  { label: 'Crypto', searchTerm: 'crypto', icon: CoinIcon },
  { label: 'Stocks', searchTerm: 'stocks', icon: TrendingUpIcon },
  { label: 'Predict Market', searchTerm: 'predict', icon: CrystalBallIcon },
];

const exploreTags: DiscoverTag[] = [
  { label: 'Altcoins', searchTerm: 'altcoins', icon: AlienIcon },
  { label: 'Newly Listed', searchTerm: 'newly-listed', icon: SparklesIcon },
  { label: 'Daily Movers', searchTerm: 'movers', icon: LightningIcon },
  { label: 'Technology', searchTerm: 'tech', icon: RobotIcon },
  { label: 'DeFi', searchTerm: 'defi', icon: LinkIcon },
  { label: 'Gaming', searchTerm: 'gaming', icon: GamepadIcon },
];


const MarketPage: Component = () => {
  const navigate = useNavigate();
  const [state, actions] = useAppContext();
  const { editor } = useEditor();
  
  const [activeTag, setActiveTag] = createSignal<MarketTag>('crypto');
  const [cryptoInstruments, setCryptoInstruments] = createSignal<Instrument[]>([]);
  const [stockInstruments, setStockInstruments] = createSignal<Instrument[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [tickers, setTickers] = createStore<Record<string, TickerData>>({});
  let pollingIntervalId: number;
  
  const activeInstruments = createMemo(() => {
    if (activeTag() === 'stocks') {
      return stockInstruments();
    }
    return cryptoInstruments();
  });
  
  const fetchCryptoTickers = async () => {
    try {
      const tickerDataArray = await datafeed.getOkxTickers();
      const tickerMap = tickerDataArray.reduce((acc, ticker) => {
        acc[ticker.symbol] = ticker;
        return acc;
      }, {} as Record<string, TickerData>);
      setTickers(tickerMap);
    } catch (error) {
      console.error("Failed to fetch real-time ticker data:", error);
    }
  };
  
  onMount(() => {
    const marketExtension = createMarketChatExtension(
      [state, actions], 
      editor, 
      activeInstruments as Accessor<Instrument[]>
    );
    actions.setChatExtension(marketExtension);

    setLoading(true);
    Promise.all([
      new Promise<Instrument[]>((resolve) => {
        datafeed.searchSymbols('', 'crypto', (instruments) => {
          // --- 核心修正：在这里过滤出 USDT 交易对 ---
          const usdtInstruments = instruments.filter(inst => inst.quoteCurrency === 'USDT');
          resolve(usdtInstruments.slice(0, 100));
        });
      }),
      new Promise<Instrument[]>((resolve) => {
        datafeed.searchSymbols('a', 'stocks', (instruments) => {
          const topStocks = ['AAPL', 'GOOG', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'META'];
          const filtered = instruments.filter(i => topStocks.includes(i.baseSymbol));
          resolve(filtered);
        });
      })
    ]).then(([cryptos, stocks]) => {
      setCryptoInstruments(cryptos);
      setStockInstruments(stocks);
      fetchCryptoTickers().finally(() => setLoading(false));
      pollingIntervalId = setInterval(fetchCryptoTickers, POLLING_INTERVAL);
    });
  });

  onCleanup(() => {
    clearInterval(pollingIntervalId);
    if (state.chatExtension) {
      actions.setChatExtension(null);
    }
  });

  const handleItemClick = (instrument: Instrument) => {
    if (instrument.identifier) {
      const encodedIdentifier = encodeURIComponent(instrument.identifier);
      navigate(`/market/${encodedIdentifier}`);
    }
  };

  return (
    <div class="market-page-container">
      <DiscoverTags 
        tags={mainTags} 
        activeTag={activeTag()}
        onTagClick={(tag) => setActiveTag(tag as MarketTag)}
      />
      <DiscoverTags 
        title="Explore"
        tags={exploreTags} 
        activeTag={activeTag()}
        onTagClick={(tag) => setActiveTag(tag as MarketTag)}
      />

      <div class="asset-list-divider" />
      <AssetList
        instruments={activeInstruments()}
        tickers={activeTag() === 'crypto' || activeTag() === 'favorites' ? tickers : {}}
        loading={loading()}
        onItemClick={handleItemClick}
      />
    </div>
  );
};

export default MarketPage;